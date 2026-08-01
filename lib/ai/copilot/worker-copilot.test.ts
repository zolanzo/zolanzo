/**
 * Phase 4.1F — Worker Copilot tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveWorkerCopilotIntent } from "@/lib/ai/copilot/worker-intent-resolver";
import { retrieveWorkerKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";
import {
  canAccessWorkerCopilotIntent,
  type WorkerCopilotAuthContext,
} from "@/lib/ai/copilot/worker-permission-filter";
import { buildAssignmentCoachLines } from "@/lib/ai/copilot/assignment-context-builder";
import { analyzeWorkerProgress } from "@/lib/ai/copilot/progress-analyzer";
import { buildWorkerRecommendations } from "@/lib/ai/copilot/worker-recommendation-builder";
import {
  askWorkerCopilot,
  workerCopilot,
  resetWorkerCopilotSessionStateForTests,
} from "@/lib/ai/copilot/worker-copilot";
import {
  isWorkerCopilotEnabled,
  isWorkerMemoryEnabled,
  isWorkerRecommendationsEnabled,
} from "@/lib/ai/copilot/worker-config";
import {
  getWorkerCopilotTelemetrySnapshot,
  resetWorkerCopilotTelemetryForTests,
} from "@/lib/ai/copilot/worker-telemetry";
import { resetCopilotMemoryForTests } from "@/lib/ai/memory/session-memory";
import type { WorkerKnowledgeFacts } from "@/lib/ai/copilot/worker-types";

const ORIGINAL_ENV = { ...process.env };

function facts(overrides: Partial<WorkerKnowledgeFacts> = {}): WorkerKnowledgeFacts {
  return {
    workerUserId: "w1",
    displayName: "Ada",
    trustScore: 78,
    approvalRate: 0.82,
    completedAssignments: 12,
    earningsThisWeekMinor: 45_000_00,
    currency: "NGN",
    avgReviewHours: 6,
    avgPaymentHours: 18,
    workerCountryCode: "NG",
    emailVerified: true,
    phoneVerified: false,
    trustTrend: "improving",
    trustReasons: ["Verified identity"],
    trustWarnings: [],
    trustLastEvents: [],
    frozenAt: new Date().toISOString(),
    assignments: [
      {
        id: "a1",
        publicId: "ASN-245",
        campaignPublicId: "CMP-1",
        campaignName: "Lagos Sweep",
        status: "in_progress",
        rewardMinor: 15_000_00,
        currency: "NGN",
        expiresAt: new Date(Date.now() + 4 * 3_600_000).toISOString(),
        progressPercent: 60,
        requiredEvidenceKinds: ["image", "gps"],
        presentEvidenceKinds: ["image"],
        gpsRequired: true,
        gpsSatisfied: true,
        countryCode: "NG",
        distanceScore: 0.1,
        submittedAt: null,
        lastRejectionReason: null,
      },
      {
        id: "a2",
        publicId: "ASN-246",
        campaignPublicId: "CMP-2",
        campaignName: "Kano Photos",
        status: "assigned",
        rewardMinor: 8_000_00,
        currency: "NGN",
        expiresAt: new Date(Date.now() + 48 * 3_600_000).toISOString(),
        progressPercent: 10,
        requiredEvidenceKinds: ["image"],
        presentEvidenceKinds: [],
        gpsRequired: false,
        gpsSatisfied: null,
        countryCode: "NG-KN",
        distanceScore: 0.6,
        submittedAt: null,
        lastRejectionReason: null,
      },
    ],
    submissions: [
      {
        publicId: "SUB-9",
        status: "rejected",
        assignmentPublicId: "ASN-200",
        submittedAt: new Date().toISOString(),
        reviewOutcome: "rejected",
        missingEvidence: ["gps"],
      },
    ],
    payments: [
      {
        publicId: "STL-1",
        status: "completed",
        amountMinor: 12_000_00,
        createdAt: new Date().toISOString(),
      },
    ],
    ...overrides,
  };
}

function auth(
  overrides: Partial<WorkerCopilotAuthContext> = {},
): WorkerCopilotAuthContext {
  return {
    actorUserId: "w1",
    workerUserId: "w1",
    permissions: [
      "assignments.read",
      "submissions.create",
      "wallet.read",
      "workers.profile.read",
    ],
    ...overrides,
  };
}

beforeEach(() => {
  resetWorkerCopilotTelemetryForTests();
  resetWorkerCopilotSessionStateForTests();
  resetCopilotMemoryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AI_WORKER_COPILOT;
  delete process.env.AI_WORKER_MEMORY;
  delete process.env.AI_WORKER_RECOMMENDATIONS;
  delete process.env.AI_ENABLED;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults worker copilot flags on", () => {
    expect(isWorkerCopilotEnabled()).toBe(true);
    expect(isWorkerMemoryEnabled()).toBe(true);
    expect(isWorkerRecommendationsEnabled()).toBe(true);
  });

  it("respects AI_WORKER_COPILOT=0", () => {
    process.env.AI_WORKER_COPILOT = "0";
    expect(isWorkerCopilotEnabled()).toBe(false);
  });
});

describe("IntentResolver", () => {
  it("routes next best task", () => {
    expect(
      resolveWorkerCopilotIntent({
        question: "What should I do next?",
      }).intent,
    ).toBe("next_best_task");
  });

  it("routes earnings and nearby", () => {
    expect(
      resolveWorkerCopilotIntent({
        question: "How much have I earned this week?",
      }).intent,
    ).toBe("weekly_earnings");
    expect(
      resolveWorkerCopilotIntent({
        question: "Which jobs are nearby?",
      }).intent,
    ).toBe("nearby_work");
  });

  it("routes assignment coach", () => {
    expect(
      resolveWorkerCopilotIntent({
        question: "Am I ready to submit?",
      }).intent,
    ).toBe("assignment_coach");
  });
});

describe("PermissionFilter", () => {
  it("allows self with matching permission", () => {
    expect(canAccessWorkerCopilotIntent(auth(), "my_assignments")).toBe(true);
  });

  it("denies cross-worker access", () => {
    expect(
      canAccessWorkerCopilotIntent(
        auth({ actorUserId: "w1", workerUserId: "w2" }),
        "my_assignments",
      ),
    ).toBe(false);
  });

  it("denies wallet intent without wallet.read", () => {
    expect(
      canAccessWorkerCopilotIntent(
        auth({ permissions: ["assignments.read"] }),
        "weekly_earnings",
      ),
    ).toBe(false);
  });
});

describe("Knowledge retrieval", () => {
  it("surfaces next best by expiry then pay", () => {
    const retrieved = retrieveWorkerKnowledge({
      intent: "next_best_task",
      facts: facts(),
    });
    expect(retrieved.assignments[0]?.publicId).toBe("ASN-245");
    expect(retrieved.findings[0]).toMatch(/ASN-245/);
  });

  it("lists missing evidence", () => {
    const retrieved = retrieveWorkerKnowledge({
      intent: "missing_evidence",
      facts: facts(),
    });
    expect(retrieved.findings.some((f) => /Missing: gps/i.test(f))).toBe(true);
  });
});

describe("Assignment coach", () => {
  it("builds checklist and readiness", () => {
    const lines = buildAssignmentCoachLines(facts().assignments[0]);
    expect(lines.some((l) => /Photos remaining/i.test(l))).toBe(true);
    expect(lines.some((l) => /Ready to submit/i.test(l))).toBe(true);
  });
});

describe("Progress coach", () => {
  it("analyzes personal metrics", () => {
    const retrieved = retrieveWorkerKnowledge({
      intent: "progress",
      facts: facts(),
    });
    const analysis = analyzeWorkerProgress({ facts: facts(), retrieved });
    expect(analysis.completedAssignments).toBe(12);
    expect(analysis.lines.some((l) => /Approval rate/i.test(l))).toBe(true);
  });
});

describe("Recommendations", () => {
  it("explains recommendations when enabled", () => {
    const retrieved = retrieveWorkerKnowledge({
      intent: "next_best_task",
      facts: facts(),
    });
    const recs = buildWorkerRecommendations({
      intent: "next_best_task",
      facts: facts(),
      retrieved,
    });
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.reason.length).toBeGreaterThan(0);
    expect(recs[0]?.confidence).toBeGreaterThan(0.5);
  });

  it("returns empty when AI_WORKER_RECOMMENDATIONS=0", () => {
    process.env.AI_WORKER_RECOMMENDATIONS = "0";
    const retrieved = retrieveWorkerKnowledge({
      intent: "next_best_task",
      facts: facts(),
    });
    expect(
      buildWorkerRecommendations({
        intent: "next_best_task",
        facts: facts(),
        retrieved,
      }),
    ).toEqual([]);
  });
});

describe("askWorkerCopilot", () => {
  it("answers advisory-only with confidence", async () => {
    const response = await askWorkerCopilot({
      workerUserId: "w1",
      actorUserId: "w1",
      question: "What should I do next?",
      auth: auth(),
      facts: facts(),
      forceRuleOnly: true,
    });
    expect(response.advisoryOnly).toBe(true);
    expect(response.answer.length).toBeGreaterThan(0);
    expect(response.confidence).toBeGreaterThan(0);
    expect(getWorkerCopilotTelemetrySnapshot().questionsToday).toBe(1);
  });

  it("supports session follow-ups", async () => {
    await askWorkerCopilot({
      workerUserId: "w1",
      actorUserId: "w1",
      question: "What should I do next?",
      auth: auth(),
      facts: facts(),
      forceRuleOnly: true,
      threadKey: "t1",
    });
    const follow = await askWorkerCopilot({
      workerUserId: "w1",
      actorUserId: "w1",
      question: "Why?",
      auth: auth(),
      facts: facts(),
      forceRuleOnly: true,
      threadKey: "t1",
    });
    expect(follow.intent).toBe("next_best_task");
  });

  it("denies other workers", async () => {
    const response = await askWorkerCopilot({
      workerUserId: "w2",
      actorUserId: "w1",
      question: "My assignments",
      auth: auth({ workerUserId: "w2" }),
      facts: facts({ workerUserId: "w2" }),
      forceRuleOnly: true,
    });
    expect(response.answer).toMatch(/can't answer|only ask about your own/i);
    expect(response.confidence).toBe(0);
  });

  it("falls back when disabled", async () => {
    process.env.AI_WORKER_COPILOT = "false";
    const response = await askWorkerCopilot({
      workerUserId: "w1",
      actorUserId: "w1",
      question: "What should I do next?",
      auth: auth(),
      facts: facts(),
    });
    expect(response.answer).toMatch(/disabled/i);
    expect(response.fallbackUsed).toBe(true);
  });

  it("port adapter returns CopilotAnswer", async () => {
    const result = await workerCopilot.ask({
      organizationId: "worker:w1",
      actorUserId: "w1",
      workerUserId: "w1",
      messages: [{ role: "user", content: "My assignments" }],
      knowledgeSnapshot: {
        facts: facts(),
        auth: auth(),
        forceRuleOnly: true,
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.answer.length).toBeGreaterThan(0);
  });
});
