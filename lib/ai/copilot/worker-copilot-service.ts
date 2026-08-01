/**
 * WorkerCopilotService — load self-only worker facts + ask copilot.
 * Read-only Prisma access; never mutates domain.
 * Never loads other workers' rows or org-private / internal review notes.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Permission } from "@/constants/permissions";
import { askWorkerCopilot } from "@/lib/ai/copilot/worker-copilot";
import type {
  WorkerAssignmentFact,
  WorkerCopilotResponse,
  WorkerKnowledgeFacts,
  WorkerPaymentFact,
  WorkerSubmissionFact,
} from "@/lib/ai/copilot/worker-types";
import type { WorkerCopilotAuthContext } from "@/lib/ai/copilot/worker-permission-filter";
import { resolveOverallTrustScore } from "@/lib/trust";
import { resolveProfile } from "@/lib/trust/trust-profile-service";

export type AskWorkerCopilotServiceInput = {
  workerUserId: string;
  actorUserId: string;
  question: string;
  permissions: readonly Permission[];
  threadKey?: string;
  forceRuleOnly?: boolean;
  sessionOrganizationId?: string;
  factsOverride?: WorkerKnowledgeFacts;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function extractReward(executionContext: unknown): {
  rewardMinor: number;
  currency: string;
} {
  const ctx = asRecord(executionContext);
  const snap = asRecord(ctx?.rewardSnapshot);
  const rewardMinor =
    typeof snap?.rewardPerUnitMinor === "number" ? snap.rewardPerUnitMinor : 0;
  const currency =
    typeof snap?.currency === "string" ? snap.currency : "NGN";
  return { rewardMinor, currency };
}

function extractRequiredEvidence(executionContext: unknown): string[] {
  const ctx = asRecord(executionContext);
  const required = ctx?.requiredEvidenceKinds;
  if (Array.isArray(required)) {
    return required.filter((x): x is string => typeof x === "string");
  }
  // Default field checklist expectations for coaching
  return ["image", "gps"];
}

async function loadWorkerKnowledgeFacts(
  workerUserId: string,
): Promise<WorkerKnowledgeFacts> {
  const user = await prisma.user.findUnique({
    where: { id: workerUserId },
    select: {
      id: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      locale: true,
      profile: {
        select: {
          displayName: true,
          countryCode: true,
        },
      },
    },
  });
  if (!user) {
    throw new Error(`Worker not found: ${workerUserId}`);
  }

  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
  weekStart.setUTCHours(0, 0, 0, 0);

  const [assignments, submissions, settlements, reviewDecisions] =
    await Promise.all([
      prisma.assignment.findMany({
        where: { workerUserId },
        take: 80,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          publicId: true,
          status: true,
          progressPercent: true,
          expiresAt: true,
          submittedAt: true,
          executionContext: true,
          campaign: {
            select: {
              publicId: true,
              name: true,
              currency: true,
              rewardPerUnitMinor: true,
              countryScope: true,
            },
          },
          submissions: {
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: {
              status: true,
              gpsSnapshot: true,
              manifest: {
                select: {
                  items: { select: { kind: true } },
                },
              },
              reviewDecisions: {
                take: 1,
                orderBy: { decidedAt: "desc" },
                select: {
                  outcome: true,
                  requestedRevisions: true,
                  // Intentionally omit comments (internal review notes)
                  findings: {
                    take: 5,
                    select: { category: true, severity: true, message: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.submission.findMany({
        where: { workerUserId },
        take: 40,
        orderBy: { updatedAt: "desc" },
        select: {
          publicId: true,
          status: true,
          submittedAt: true,
          assignment: { select: { publicId: true } },
          reviewDecisions: {
            take: 1,
            orderBy: { decidedAt: "desc" },
            select: {
              outcome: true,
              requestedRevisions: true,
            },
          },
        },
      }),
      prisma.settlement.findMany({
        where: { workerUserId },
        take: 40,
        orderBy: { createdAt: "desc" },
        select: {
          publicId: true,
          status: true,
          netMinor: true,
          currency: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.reviewDecision.findMany({
        where: { submission: { workerUserId } },
        take: 100,
        orderBy: { decidedAt: "desc" },
        select: {
          outcome: true,
          decidedAt: true,
          submission: { select: { submittedAt: true } },
        },
      }),
    ]);

  const completedAssignments = assignments.filter(
    (a) => a.status === "completed",
  ).length;
  const decided = reviewDecisions.length;
  const approved = reviewDecisions.filter(
    (d) =>
      d.outcome === "approved" || d.outcome === "approved_with_warning",
  ).length;
  const approvalRate = decided > 0 ? approved / decided : 0.7;
  const emailVerified = Boolean(user.emailVerifiedAt);
  const phoneVerified = Boolean(user.phoneVerifiedAt);
  const completionRate =
    assignments.length > 0 ? completedAssignments / assignments.length : 0.6;
  let trustScore = resolveOverallTrustScore({
    userId: workerUserId,
    emailVerified,
    phoneVerified,
    approvalRate,
    completionRate,
    completedAssignments,
    totalAssignments: assignments.length,
    reviewsDecided: decided,
    reviewsApproved: approved,
  });
  let trustTrend: string | null = null;
  let trustReasons: string[] = [];
  let trustWarnings: string[] = [];
  let trustLastEvents: WorkerKnowledgeFacts["trustLastEvents"] = [];
  try {
    const persisted = await resolveProfile({
      subjectType: "worker",
      subjectId: workerUserId,
      ensure: false,
    });
    if (persisted) {
      trustScore = persisted.overallScore;
      trustTrend = persisted.trend;
      trustReasons = persisted.reasons;
      trustWarnings = persisted.warnings;
      trustLastEvents = persisted.lastInfluencingEvents;
    }
  } catch {
    // Fall back to calculator bridge
  }

  const earningsThisWeekMinor = settlements
    .filter(
      (s) =>
        s.status === "completed" &&
        s.completedAt != null &&
        s.completedAt >= weekStart,
    )
    .reduce((sum, s) => sum + s.netMinor, 0);

  let reviewHoursSum = 0;
  let reviewHoursCount = 0;
  for (const d of reviewDecisions) {
    if (!d.submission.submittedAt) continue;
    const hrs =
      (d.decidedAt.getTime() - d.submission.submittedAt.getTime()) /
      3_600_000;
    if (hrs >= 0 && hrs < 720) {
      reviewHoursSum += hrs;
      reviewHoursCount += 1;
    }
  }

  let paymentHoursSum = 0;
  let paymentHoursCount = 0;
  for (const s of settlements) {
    if (s.status !== "completed" || !s.completedAt) continue;
    const hrs =
      (s.completedAt.getTime() - s.createdAt.getTime()) / 3_600_000;
    if (hrs >= 0 && hrs < 720) {
      paymentHoursSum += hrs;
      paymentHoursCount += 1;
    }
  }

  const workerCountry = user.profile?.countryCode ?? null;
  const currency =
    settlements[0]?.currency ??
    assignments[0]?.campaign.currency ??
    "NGN";

  const assignmentFacts: WorkerAssignmentFact[] = assignments.map((a) => {
    const fromCtx = extractReward(a.executionContext);
    const rewardMinor =
      fromCtx.rewardMinor || a.campaign.rewardPerUnitMinor || 0;
    const latest = a.submissions[0];
    const presentEvidenceKinds = [
      ...new Set(
        (latest?.manifest?.items ?? []).map((i) => String(i.kind)),
      ),
    ];
    const requiredEvidenceKinds = extractRequiredEvidence(a.executionContext);
    const gpsRequired = requiredEvidenceKinds.includes("gps");
    let gpsSatisfied: boolean | null = null;
    if (gpsRequired) {
      if (latest?.gpsSnapshot) gpsSatisfied = true;
      else if (presentEvidenceKinds.includes("gps")) gpsSatisfied = true;
      else gpsSatisfied = latest ? false : null;
    }

    const decision = latest?.reviewDecisions[0];
    let lastRejectionReason: string | null = null;
    if (
      decision &&
      (decision.outcome === "rejected" ||
        decision.outcome === "revision_requested")
    ) {
      const findingMsg = decision.findings[0]?.message;
      const revisions = Array.isArray(decision.requestedRevisions)
        ? decision.requestedRevisions
            .filter((x): x is string => typeof x === "string")
            .slice(0, 3)
        : [];
      lastRejectionReason =
        findingMsg ??
        (revisions.length
          ? `Revision needed: ${revisions.join(", ")}`
          : `Outcome: ${decision.outcome}`);
    }

    const countryScope = Array.isArray(a.campaign.countryScope)
      ? (a.campaign.countryScope as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : [];
    const distanceScore =
      workerCountry && countryScope.length
        ? countryScope.some(
            (c) =>
              c === workerCountry ||
              c.startsWith(`${workerCountry}-`) ||
              workerCountry.startsWith(c),
          )
          ? 0.1
          : 0.7
        : 0.4;

    return {
      id: a.id,
      publicId: a.publicId,
      campaignPublicId: a.campaign.publicId,
      campaignName: a.campaign.name,
      status: a.status,
      rewardMinor,
      currency: fromCtx.currency || a.campaign.currency || currency,
      expiresAt: a.expiresAt?.toISOString() ?? null,
      progressPercent: a.progressPercent,
      requiredEvidenceKinds,
      presentEvidenceKinds,
      gpsRequired,
      gpsSatisfied,
      countryCode: countryScope[0] ?? null,
      distanceScore,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      lastRejectionReason,
    };
  });

  const submissionFacts: WorkerSubmissionFact[] = submissions.map((s) => {
    const decision = s.reviewDecisions[0];
    const missingEvidence = Array.isArray(decision?.requestedRevisions)
      ? decision!.requestedRevisions.filter(
          (x): x is string => typeof x === "string",
        )
      : [];
    return {
      publicId: s.publicId,
      status: s.status,
      assignmentPublicId: s.assignment.publicId,
      submittedAt: s.submittedAt?.toISOString() ?? null,
      reviewOutcome: decision?.outcome ?? null,
      missingEvidence,
    };
  });

  const paymentFacts: WorkerPaymentFact[] = settlements.map((s) => ({
    publicId: s.publicId,
    status: s.status,
    amountMinor: s.netMinor,
    createdAt: s.createdAt.toISOString(),
  }));

  return {
    workerUserId,
    displayName: user.profile?.displayName ?? "Worker",
    trustScore,
    approvalRate,
    completedAssignments,
    earningsThisWeekMinor,
    currency,
    avgReviewHours:
      reviewHoursCount > 0 ? reviewHoursSum / reviewHoursCount : null,
    avgPaymentHours:
      paymentHoursCount > 0 ? paymentHoursSum / paymentHoursCount : null,
    assignments: assignmentFacts,
    submissions: submissionFacts,
    payments: paymentFacts,
    workerCountryCode: workerCountry,
    emailVerified,
    phoneVerified,
    trustTrend,
    trustReasons,
    trustWarnings,
    trustLastEvents,
    frozenAt: new Date().toISOString(),
  };
}

export async function askWorkerCopilotService(
  input: AskWorkerCopilotServiceInput,
): Promise<WorkerCopilotResponse> {
  if (input.actorUserId !== input.workerUserId) {
    return askWorkerCopilot({
      workerUserId: input.workerUserId,
      actorUserId: input.actorUserId,
      question: input.question,
      auth: {
        actorUserId: input.actorUserId,
        workerUserId: input.workerUserId,
        permissions: input.permissions,
      },
      facts: {
        workerUserId: input.workerUserId,
        displayName: "Denied",
        trustScore: 0,
        approvalRate: 0,
        completedAssignments: 0,
        earningsThisWeekMinor: 0,
        currency: "NGN",
        avgReviewHours: null,
        avgPaymentHours: null,
        assignments: [],
        submissions: [],
        payments: [],
        workerCountryCode: null,
        emailVerified: false,
        phoneVerified: false,
        trustTrend: null,
        trustReasons: [],
        trustWarnings: [],
        trustLastEvents: [],
        frozenAt: new Date().toISOString(),
      },
      threadKey: input.threadKey,
      forceRuleOnly: true,
      sessionOrganizationId: input.sessionOrganizationId,
    });
  }

  const facts =
    input.factsOverride ??
    (await loadWorkerKnowledgeFacts(input.workerUserId));

  const auth: WorkerCopilotAuthContext = {
    actorUserId: input.actorUserId,
    workerUserId: input.workerUserId,
    permissions: input.permissions,
  };

  return askWorkerCopilot({
    workerUserId: input.workerUserId,
    actorUserId: input.actorUserId,
    question: input.question,
    auth,
    facts,
    threadKey: input.threadKey,
    forceRuleOnly: input.forceRuleOnly,
    sessionOrganizationId: input.sessionOrganizationId,
  });
}

/** Alias matching org service naming */
export const askWorkerCopilotForUser = askWorkerCopilotService;
