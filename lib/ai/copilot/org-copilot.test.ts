/**
 * Phase 4.1E — Organization Copilot tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveOrgCopilotIntent } from "@/lib/ai/copilot/intent-resolver";
import { retrieveOrgKnowledge } from "@/lib/ai/copilot/knowledge-retriever";
import {
  canAccessOrgCopilotIntent,
  type OrgCopilotAuthContext,
} from "@/lib/ai/copilot/permission-filter";
import { buildOrgRecommendations } from "@/lib/ai/copilot/recommendation-builder";
import {
  askOrganizationCopilot,
  organizationCopilot,
  resetOrgCopilotSessionStateForTests,
} from "@/lib/ai/copilot/organization-copilot";
import {
  isOrgCopilotEnabled,
  isOrgMemoryEnabled,
  isOrgRecommendationsEnabled,
} from "@/lib/ai/copilot/org-config";
import {
  getOrgCopilotTelemetrySnapshot,
  resetOrgCopilotTelemetryForTests,
} from "@/lib/ai/copilot/org-telemetry";
import { resetCopilotMemoryForTests } from "@/lib/ai/memory/session-memory";
import type { OrgKnowledgeFacts } from "@/lib/ai/copilot/org-types";

const ORIGINAL_ENV = { ...process.env };

function facts(overrides: Partial<OrgKnowledgeFacts> = {}): OrgKnowledgeFacts {
  return {
    organizationId: "org_1",
    organizationName: "Acme Field",
    currency: "NGN",
    frozenAt: new Date().toISOString(),
    spendingThisQuarterMinor: 1_500_000_00,
    campaigns: [
      {
        id: "c1",
        publicId: "CMP-1",
        name: "Kano Sweep",
        status: "active",
        targetQuantity: 100,
        completedQuantity: 20,
        approvedQuantity: 15,
        rejectedQuantity: 5,
        budgetMinor: 2_000_000_00,
        spentBudgetMinor: 400_000_00,
        countryScope: ["NG"],
        endAt: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: "c2",
        publicId: "CMP-2",
        name: "Lagos Fast",
        status: "active",
        targetQuantity: 50,
        completedQuantity: 45,
        approvedQuantity: 40,
        rejectedQuantity: 2,
        budgetMinor: 800_000_00,
        spentBudgetMinor: 700_000_00,
        countryScope: ["NG-LA"],
        endAt: new Date(Date.now() + 10 * 86_400_000).toISOString(),
      },
    ],
    workers: [
      {
        userId: "w1",
        displayName: "Ada",
        completedTasks: 40,
        approvalRate: 0.95,
        activeAssignments: 0,
        lastActivityAt: new Date().toISOString(),
        trustScore: 91,
        trustTrend: "improving",
        reliabilityScore: 94,
      },
      {
        userId: "w2",
        displayName: "Bola",
        completedTasks: 5,
        approvalRate: 0.7,
        activeAssignments: 0,
        lastActivityAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
        trustScore: 55,
        trustTrend: "declining",
        reliabilityScore: 60,
      },
    ],
    reviewers: [
      {
        userId: "r1",
        displayName: "Chi",
        pendingQueue: 12,
        assignedCount: 3,
      },
      {
        userId: "r2",
        displayName: "Dee",
        pendingQueue: 2,
        assignedCount: 1,
      },
    ],
    payments: [
      {
        publicId: "PAY-1",
        status: "awaiting_payment",
        amountMinor: 50_000_00,
        createdAt: new Date().toISOString(),
      },
      {
        publicId: "PAY-2",
        status: "succeeded",
        amountMinor: 10_000_00,
        createdAt: new Date().toISOString(),
      },
    ],
    fraudTrends: [
      {
        campaignId: "c1",
        campaignName: "Kano Sweep",
        highRiskCount: 4,
        avgRiskScore: 72,
      },
    ],
    ...overrides,
  };
}

function auth(
  overrides: Partial<OrgCopilotAuthContext> = {},
): OrgCopilotAuthContext {
  return {
    organizationId: "org_1",
    actorUserId: "user_1",
    isOrgMember: true,
    permissions: ["campaigns.read", "payments.create"],
    ...overrides,
  };
}

beforeEach(() => {
  resetOrgCopilotTelemetryForTests();
  resetOrgCopilotSessionStateForTests();
  resetCopilotMemoryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AI_ORG_COPILOT;
  delete process.env.AI_ORG_MEMORY;
  delete process.env.AI_ORG_RECOMMENDATIONS;
  delete process.env.AI_ENABLED;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults org copilot flags on", () => {
    expect(isOrgCopilotEnabled()).toBe(true);
    expect(isOrgMemoryEnabled()).toBe(true);
    expect(isOrgRecommendationsEnabled()).toBe(true);
  });

  it("respects AI_ORG_COPILOT=0", () => {
    process.env.AI_ORG_COPILOT = "0";
    expect(isOrgCopilotEnabled()).toBe(false);
  });
});

describe("IntentResolver", () => {
  it("routes campaign behind schedule", () => {
    expect(
      resolveOrgCopilotIntent({
        question: "Which campaigns are behind schedule?",
      }).intent,
    ).toBe("campaigns_behind_schedule");
  });

  it("routes top workers and pending payments", () => {
    expect(
      resolveOrgCopilotIntent({
        question: "Who are my top-performing workers this month?",
      }).intent,
    ).toBe("top_workers");
    expect(
      resolveOrgCopilotIntent({
        question: "What payments are still pending?",
      }).intent,
    ).toBe("pending_payments");
  });

  it("supports follow-up why with previous intent", () => {
    const result = resolveOrgCopilotIntent({
      question: "Why?",
      previousIntent: "campaigns_behind_schedule",
    });
    expect(result.intent).toBe("campaigns_behind_schedule");
    expect(result.isFollowUp).toBe(true);
  });
});

describe("PermissionFilter", () => {
  it("allows member with campaigns.read", () => {
    expect(
      canAccessOrgCopilotIntent(auth(), "campaigns_behind_schedule"),
    ).toBe(true);
  });

  it("denies non-members", () => {
    expect(
      canAccessOrgCopilotIntent(
        auth({ isOrgMember: false }),
        "top_workers",
      ),
    ).toBe(false);
  });

  it("denies missing payment permission for spending when only empty perms", () => {
    expect(
      canAccessOrgCopilotIntent(
        auth({ permissions: [] }),
        "organization_spending",
      ),
    ).toBe(false);
  });
});

describe("KnowledgeRetriever", () => {
  it("finds behind-schedule campaigns", () => {
    const retrieved = retrieveOrgKnowledge({
      intent: "campaigns_behind_schedule",
      facts: facts(),
    });
    expect(retrieved.campaigns.some((c) => c.publicId === "CMP-1")).toBe(true);
    expect(retrieved.findings.length).toBeGreaterThan(0);
  });

  it("lists pending payments", () => {
    const retrieved = retrieveOrgKnowledge({
      intent: "pending_payments",
      facts: facts(),
    });
    expect(retrieved.payments).toHaveLength(1);
    expect(retrieved.metrics.pendingCount).toBe(1);
  });
});

describe("Recommendations", () => {
  it("suggests workflow-linked recommendations", () => {
    const retrieved = retrieveOrgKnowledge({
      intent: "campaigns_behind_schedule",
      facts: facts(),
    });
    const recs = buildOrgRecommendations({
      intent: "campaigns_behind_schedule",
      retrieved,
    });
    expect(recs.some((r) => r.workflowHint === "campaigns.detail")).toBe(true);
  });

  it("skips recommendations when flag off", () => {
    process.env.AI_ORG_RECOMMENDATIONS = "0";
    const retrieved = retrieveOrgKnowledge({
      intent: "fraud_trends",
      facts: facts(),
    });
    expect(
      buildOrgRecommendations({ intent: "fraud_trends", retrieved }),
    ).toEqual([]);
  });
});

describe("askOrganizationCopilot", () => {
  it("answers behind-schedule question with advisory payload", async () => {
    const response = await askOrganizationCopilot({
      organizationId: "org_1",
      actorUserId: "user_1",
      question: "Which campaigns are behind schedule?",
      auth: auth(),
      facts: facts(),
      forceRuleOnly: true,
    });
    expect(response.advisoryOnly).toBe(true);
    expect(response.intent).toBe("campaigns_behind_schedule");
    expect(response.answer).toMatch(/behind schedule/i);
    expect(response.keyFindings.length).toBeGreaterThan(0);
    expect(response.recommendations.length).toBeGreaterThan(0);
    expect(response.suggestedFollowUps.length).toBeGreaterThan(0);
    expect(response.fallbackUsed).toBe(true);
    expect(getOrgCopilotTelemetrySnapshot().questionsToday).toBe(1);
  });

  it("uses conversation memory for follow-ups", async () => {
    await askOrganizationCopilot({
      organizationId: "org_1",
      actorUserId: "user_1",
      question: "Which campaigns are behind schedule?",
      auth: auth(),
      facts: facts(),
      threadKey: "t1",
      forceRuleOnly: true,
    });
    const follow = await askOrganizationCopilot({
      organizationId: "org_1",
      actorUserId: "user_1",
      question: "Why?",
      auth: auth(),
      facts: facts(),
      threadKey: "t1",
      forceRuleOnly: true,
    });
    expect(follow.intent).toBe("campaigns_behind_schedule");
    expect(follow.answer).toMatch(/Following up/i);
  });

  it("denies unauthorized callers", async () => {
    const response = await askOrganizationCopilot({
      organizationId: "org_1",
      actorUserId: "outsider",
      question: "Who are my top-performing workers this month?",
      auth: auth({ isOrgMember: false, permissions: [] }),
      facts: facts(),
      forceRuleOnly: true,
    });
    expect(response.confidence).toBe(0);
    expect(response.answer).toMatch(/can't answer/i);
  });

  it("falls back when disabled", async () => {
    process.env.AI_ORG_COPILOT = "false";
    const response = await askOrganizationCopilot({
      organizationId: "org_1",
      actorUserId: "user_1",
      question: "How much have we spent this quarter?",
      auth: auth(),
      facts: facts(),
    });
    expect(response.answer).toMatch(/disabled/i);
    expect(response.fallbackUsed).toBe(true);
  });

  it("augments when AI_ENABLED", async () => {
    process.env.AI_ENABLED = "1";
    const response = await askOrganizationCopilot({
      organizationId: "org_1",
      actorUserId: "user_1",
      question: "What payments are still pending?",
      auth: auth(),
      facts: facts(),
    });
    expect(response.aiAugmented).toBe(true);
    expect(response.answer).toMatch(/Advisory insight/i);
  });

  it("OrganizationCopilot port works", async () => {
    const result = await organizationCopilot.ask({
      organizationId: "org_1",
      actorUserId: "user_1",
      messages: [
        { role: "user", content: "Which reviewers have the highest workload?" },
      ],
      knowledgeSnapshot: {
        facts: facts(),
        auth: auth(),
        forceRuleOnly: true,
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.answer).toMatch(/workload/i);
  });
});
