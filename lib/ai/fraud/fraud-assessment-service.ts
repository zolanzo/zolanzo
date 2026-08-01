/**
 * FraudAssessmentService — load submission evidence and run advisory assessment.
 * Never mutates submissions, reviews, or queues.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { collectFraudEvidence } from "@/lib/ai/fraud/evidence-collector";
import { assessSubmissionFraud } from "@/lib/ai/fraud/fraud-detector";
import type { FraudAssessment } from "@/lib/ai/fraud/fraud-types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export type AssessSubmissionInput = {
  submissionId: string;
  organizationId?: string | null;
  forceRuleOnly?: boolean;
};

/**
 * Assess fraud risk for a submission. Advisory only.
 */
export async function assessSubmissionRisk(
  input: AssessSubmissionInput,
): Promise<FraudAssessment> {
  const submission = await prisma.submission.findFirst({
    where: {
      OR: [{ id: input.submissionId }, { publicId: input.submissionId }],
    },
    select: {
      id: true,
      publicId: true,
      workerUserId: true,
      status: true,
      deviceSnapshot: true,
      gpsSnapshot: true,
      timingMetrics: true,
      submittedAt: true,
      readyAt: true,
      createdAt: true,
      metadata: true,
      assignment: {
        select: {
          campaignId: true,
          campaign: {
            select: {
              organizationId: true,
              countryScope: true,
              metadata: true,
              taskTemplate: {
                select: { requiredEvidence: true },
              },
            },
          },
        },
      },
      manifest: {
        select: {
          items: {
            where: { replacedAt: null },
            select: {
              id: true,
              kind: true,
              label: true,
              contentHash: true,
              sizeBytes: true,
              replacedAt: true,
            },
          },
        },
      },
      summary: {
        select: { timeSpentSeconds: true, workerNotesSummary: true },
      },
      worker: {
        select: {
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          profile: { select: { countryCode: true } },
        },
      },
    },
  });

  if (!submission) {
    throw new Error(`Submission not found: ${input.submissionId}`);
  }

  const orgId = submission.assignment.campaign.organizationId;
  if (input.organizationId && input.organizationId !== orgId) {
    throw new Error("Submission does not belong to organization");
  }

  const hashes = (submission.manifest?.items ?? [])
    .map((i) => i.contentHash)
    .filter((h): h is string => Boolean(h));

  const device = asRecord(submission.deviceSnapshot);
  const fingerprint =
    typeof device?.fingerprint === "string"
      ? device.fingerprint
      : typeof device?.deviceFingerprint === "string"
        ? device.deviceFingerprint
        : null;

  const oneHourAgo = new Date(Date.now() - 3_600_000);

  const [
    duplicateHashMatches,
    sharedDeviceAccountCount,
    recentSubmissionBurst,
    reviewStats,
    previousSubmission,
  ] = await Promise.all([
    hashes.length > 0
      ? prisma.evidenceItem.count({
          where: {
            contentHash: { in: hashes },
            replacedAt: null,
            manifest: { submissionId: { not: submission.id } },
          },
        })
      : Promise.resolve(0),
    fingerprint
      ? prisma.submission
          .findMany({
            where: {
              id: { not: submission.id },
              deviceSnapshot: {
                path: ["fingerprint"],
                equals: fingerprint,
              },
            },
            select: { workerUserId: true },
            take: 50,
          })
          .then((rows) => new Set(rows.map((r) => r.workerUserId)).size)
      : Promise.resolve(0),
    prisma.submission.count({
      where: {
        workerUserId: submission.workerUserId,
        id: { not: submission.id },
        submittedAt: { gte: oneHourAgo },
      },
    }),
    prisma.reviewDecision.groupBy({
      by: ["outcome"],
      where: { submission: { workerUserId: submission.workerUserId } },
      _count: { _all: true },
    }),
    prisma.submission.findFirst({
      where: {
        workerUserId: submission.workerUserId,
        id: { not: submission.id },
        submittedAt: { not: null },
      },
      orderBy: { submittedAt: "desc" },
      select: {
        gpsSnapshot: true,
        submittedAt: true,
      },
    }),
  ]);

  let rejected = 0;
  let decided = 0;
  for (const row of reviewStats) {
    decided += row._count._all;
    if (row.outcome === "rejected") rejected += row._count._all;
  }
  const historicalRejectionRate = decided > 0 ? rejected / decided : 0;

  const requiredEvidence = submission.assignment.campaign.taskTemplate
    .requiredEvidence;
  const requiredKinds = Array.isArray(requiredEvidence)
    ? requiredEvidence
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "kind" in item) {
            return String((item as { kind: unknown }).kind);
          }
          return null;
        })
        .filter((k): k is string => Boolean(k))
    : [];

  const campaignMeta = asRecord(submission.assignment.campaign.metadata);
  const center =
    campaignMeta &&
    typeof campaignMeta.centerLat === "number" &&
    typeof campaignMeta.centerLng === "number"
      ? {
          lat: campaignMeta.centerLat,
          lng: campaignMeta.centerLng,
        }
      : null;
  const radiusKm =
    typeof campaignMeta?.radiusKm === "number" ? campaignMeta.radiusKm : null;

  const timingMetrics = asRecord(submission.timingMetrics);
  const timeSpent =
    submission.summary?.timeSpentSeconds ??
    (typeof timingMetrics?.timeSpentSeconds === "number"
      ? timingMetrics.timeSpentSeconds
      : null);

  const bundle = collectFraudEvidence({
    submissionId: submission.id,
    submissionPublicId: submission.publicId,
    organizationId: orgId,
    campaignId: submission.assignment.campaignId,
    workerUserId: submission.workerUserId,
    status: submission.status,
    requiredEvidenceKinds: requiredKinds,
    evidenceItems: (submission.manifest?.items ?? []).map((i) => ({
      id: i.id,
      kind: i.kind,
      label: i.label,
      contentHash: i.contentHash,
      sizeBytes: i.sizeBytes,
      replacedAt: i.replacedAt?.toISOString() ?? null,
    })),
    gpsRaw: asRecord(submission.gpsSnapshot),
    deviceRaw: device,
    timing: {
      timeSpentSeconds: timeSpent,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      readyAt: submission.readyAt?.toISOString() ?? null,
      createdAt: submission.createdAt.toISOString(),
    },
    campaignCountryScope: asStringArray(
      submission.assignment.campaign.countryScope,
    ),
    campaignCenter: center,
    campaignRadiusKm: radiusKm,
    workerCountryCode: submission.worker.profile?.countryCode ?? null,
    emailVerified: Boolean(submission.worker.emailVerifiedAt),
    phoneVerified: Boolean(submission.worker.phoneVerifiedAt),
    historicalRejectionRate,
    priorFraudIndicators: 0,
    duplicateHashMatches,
    sharedDeviceAccountCount,
    recentSubmissionBurst,
    narrativeText: submission.summary?.workerNotesSummary ?? null,
    previousGpsRaw: asRecord(previousSubmission?.gpsSnapshot),
    previousSubmittedAt:
      previousSubmission?.submittedAt?.toISOString() ?? null,
  });

  return assessSubmissionFraud({
    bundle,
    forceRuleOnly: input.forceRuleOnly,
  });
}
