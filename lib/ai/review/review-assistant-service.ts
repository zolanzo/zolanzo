/**
 * ReviewAssistantService — compose fraud + campaign + evidence into advisory assistance.
 * Never mutates submissions, reviews, or decisions.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { assessSubmissionRisk } from "@/lib/ai/fraud/fraud-assessment-service";
import { haversineKm } from "@/lib/ai/fraud/rule-risk-engine";
import { assistReview } from "@/lib/ai/review/review-assistant";
import type {
  ReviewAssistance,
  ReviewContextBundle,
} from "@/lib/ai/review/review-types";

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

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type AssistSubmissionReviewInput = {
  submissionId: string;
  organizationId?: string | null;
  forceRuleOnly?: boolean;
  /** Skip live fraud call and use provided snapshot */
  fraudOverride?: {
    riskScore: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    reasons: string[];
    warnings: string[];
  };
};

export async function assistSubmissionReview(
  input: AssistSubmissionReviewInput,
): Promise<ReviewAssistance> {
  const submission = await prisma.submission.findFirst({
    where: {
      OR: [{ id: input.submissionId }, { publicId: input.submissionId }],
    },
    select: {
      id: true,
      publicId: true,
      workerUserId: true,
      status: true,
      gpsSnapshot: true,
      metadata: true,
      assignment: {
        select: {
          campaignId: true,
          campaign: {
            select: {
              organizationId: true,
              name: true,
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
        select: { workerNotesSummary: true },
      },
      worker: {
        select: {
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
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

  type FraudSnap = {
    riskScore: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    reasons: string[];
    warnings: string[];
  };

  let fraud: FraudSnap;
  if (input.fraudOverride) {
    fraud = input.fraudOverride;
  } else {
    const assessment = await assessSubmissionRisk({
      submissionId: submission.id,
      organizationId: orgId,
      forceRuleOnly: input.forceRuleOnly,
    });
    fraud = {
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      reasons: assessment.reasons,
      warnings: assessment.warnings,
    };
  }

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
      ? { lat: campaignMeta.centerLat, lng: campaignMeta.centerLng }
      : null;
  const radiusKm =
    typeof campaignMeta?.radiusKm === "number" ? campaignMeta.radiusKm : null;
  const radiusM =
    typeof campaignMeta?.radiusM === "number" ? campaignMeta.radiusM : null;

  const gps = asRecord(submission.gpsSnapshot);
  const lat = asNumber(gps?.lat ?? gps?.latitude);
  const lng = asNumber(gps?.lng ?? gps?.longitude ?? gps?.lon);
  const gpsPresent = lat != null && lng != null;
  let gpsWithinBoundary: boolean | null = null;
  if (gpsPresent && center && (radiusKm != null || radiusM != null)) {
    const distKm = haversineKm(center, { lat: lat!, lng: lng! });
    const maxKm = radiusKm ?? (radiusM != null ? radiusM / 1000 : null);
    gpsWithinBoundary = maxKm != null ? distKm <= maxKm : null;
  }

  const meta = asRecord(submission.metadata);
  const presentFormFields = asStringArray(meta?.formFields ?? meta?.fields);
  const requiredFormFields = asStringArray(
    campaignMeta?.requiredFormFields ?? [],
  );

  const campaignRulesRaw = campaignMeta?.reviewRules ?? campaignMeta?.rules;
  const campaignRules: ReviewContextBundle["campaignRules"] = Array.isArray(
    campaignRulesRaw,
  )
    ? campaignRulesRaw
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object")
        .map((r, idx) => ({
          id: String(r.id ?? `rule_${idx}`),
          kind: (r.kind as ReviewContextBundle["campaignRules"][number]["kind"]) ?? "custom",
          label: String(r.label ?? r.id ?? `Rule ${idx + 1}`),
          params: asRecord(r.params) ?? {},
        }))
    : [];

  // Implicit GPS radius rule from metadata
  if (radiusM != null || radiusKm != null) {
    campaignRules.push({
      id: "campaign.gps_radius",
      kind: "gps_radius_m",
      label: `GPS within ${radiusM ?? Math.round((radiusKm ?? 0) * 1000)} m`,
      params: { radiusM: radiusM ?? Math.round((radiusKm ?? 0) * 1000) },
    });
  }

  const hashes = (submission.manifest?.items ?? [])
    .map((i) => i.contentHash)
    .filter((h): h is string => Boolean(h));

  const [duplicateCount, reviewStats, completedCount] = await Promise.all([
    hashes.length > 0
      ? prisma.evidenceItem.count({
          where: {
            contentHash: { in: hashes },
            replacedAt: null,
            manifest: { submissionId: { not: submission.id } },
          },
        })
      : Promise.resolve(0),
    prisma.reviewDecision.groupBy({
      by: ["outcome"],
      where: { submission: { workerUserId: submission.workerUserId } },
      _count: { _all: true },
    }),
    prisma.assignment.count({
      where: { workerUserId: submission.workerUserId, status: "completed" },
    }),
  ]);

  let approved = 0;
  let decided = 0;
  for (const row of reviewStats) {
    decided += row._count._all;
    if (row.outcome === "approved" || row.outcome === "approved_with_warning") {
      approved += row._count._all;
    }
  }
  const workerApprovalRate = decided > 0 ? approved / decided : 0.7;

  const context: ReviewContextBundle = {
    submissionId: submission.id,
    submissionPublicId: submission.publicId,
    organizationId: orgId,
    campaignId: submission.assignment.campaignId,
    campaignName: submission.assignment.campaign.name,
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
    requiredFormFields,
    presentFormFields,
    gpsPresent,
    gpsWithinBoundary,
    identityVerified: Boolean(
      submission.worker.emailVerifiedAt && submission.worker.phoneVerifiedAt,
    ),
    fraudRiskScore: fraud.riskScore,
    fraudRiskLevel: fraud.riskLevel,
    fraudReasons: fraud.reasons,
    fraudWarnings: fraud.warnings,
    workerApprovalRate,
    workerCompletedTasks: completedCount,
    similarSubmissionDetected: duplicateCount > 0,
    similarSubmissionNote:
      duplicateCount > 0
        ? `${duplicateCount} matching evidence hash(es) from other submissions`
        : null,
    campaignRules,
    narrativeText: submission.summary?.workerNotesSummary ?? null,
  };

  return assistReview({
    context,
    forceRuleOnly: input.forceRuleOnly,
  });
}
