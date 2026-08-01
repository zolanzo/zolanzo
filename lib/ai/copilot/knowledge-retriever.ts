/**
 * KnowledgeRetriever — extract intent-relevant slices from OrgKnowledgeFacts.
 * Pure / read-only.
 */

import type {
  OrgCampaignFact,
  OrgCopilotIntent,
  OrgKnowledgeFacts,
  OrgPaymentFact,
  OrgReviewerFact,
  OrgWorkerFact,
} from "@/lib/ai/copilot/org-types";

export type RetrievedKnowledge = {
  intent: OrgCopilotIntent;
  dataSources: string[];
  campaigns: OrgCampaignFact[];
  workers: OrgWorkerFact[];
  reviewers: OrgReviewerFact[];
  payments: OrgPaymentFact[];
  findings: string[];
  metrics: Record<string, number | string>;
};

function completionRate(c: OrgCampaignFact): number {
  if (c.targetQuantity <= 0) return 0;
  return c.completedQuantity / c.targetQuantity;
}

function isBehindSchedule(c: OrgCampaignFact, now = Date.now()): boolean {
  if (c.status !== "active" && c.status !== "published") {
    // still consider active-like
    if (c.status !== "active") return false;
  }
  const rate = completionRate(c);
  if (c.endAt) {
    const end = Date.parse(c.endAt);
    if (Number.isFinite(end) && end < now && rate < 0.95) return true;
    if (Number.isFinite(end)) {
      const startGuess = end - 30 * 86_400_000;
      const elapsed = Math.max(0, (now - startGuess) / (end - startGuess));
      if (elapsed > 0.6 && rate < elapsed - 0.15) return true;
    }
  }
  // Heuristic: active with <50% complete and significant target
  return (
    (c.status === "active" || c.status === "published") &&
    c.targetQuantity >= 10 &&
    rate < 0.5
  );
}

export function retrieveOrgKnowledge(params: {
  intent: OrgCopilotIntent;
  facts: OrgKnowledgeFacts;
}): RetrievedKnowledge {
  const { intent, facts } = params;
  const dataSources: string[] = ["organization"];
  const findings: string[] = [];
  const metrics: Record<string, number | string> = {
    campaignCount: facts.campaigns.length,
    workerCount: facts.workers.length,
  };

  switch (intent) {
    case "campaigns_behind_schedule": {
      dataSources.push("campaigns");
      const behind = facts.campaigns
        .filter((c) => isBehindSchedule(c))
        .sort((a, b) => completionRate(a) - completionRate(b));
      for (const c of behind.slice(0, 5)) {
        findings.push(
          `${c.publicId} (${c.name}): ${Math.round(completionRate(c) * 100)}% complete`,
        );
      }
      metrics.behindCount = behind.length;
      return {
        intent,
        dataSources,
        campaigns: behind,
        workers: [],
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "campaign_performance":
    case "completion_rates": {
      dataSources.push("campaigns");
      const sorted = [...facts.campaigns].sort(
        (a, b) => completionRate(b) - completionRate(a),
      );
      for (const c of sorted.slice(0, 5)) {
        findings.push(
          `${c.publicId}: ${Math.round(completionRate(c) * 100)}% (${c.completedQuantity}/${c.targetQuantity})`,
        );
      }
      const avg =
        sorted.length > 0
          ? sorted.reduce((s, c) => s + completionRate(c), 0) / sorted.length
          : 0;
      metrics.avgCompletionRate = Math.round(avg * 100);
      return {
        intent,
        dataSources,
        campaigns: sorted,
        workers: [],
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "top_workers": {
      dataSources.push("workers", "assignments");
      const top = [...facts.workers]
        .filter((w) => w.completedTasks > 0)
        .sort(
          (a, b) =>
            b.approvalRate * 0.6 +
            Math.min(1, b.completedTasks / 50) * 0.4 -
            (a.approvalRate * 0.6 + Math.min(1, a.completedTasks / 50) * 0.4),
        )
        .slice(0, 5);
      for (const w of top) {
        findings.push(
          `${w.displayName}: ${w.completedTasks} completed, ${Math.round(w.approvalRate * 100)}% approval`,
        );
      }
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: top,
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "reviewer_workload": {
      dataSources.push("review_queue");
      const busy = [...facts.reviewers].sort(
        (a, b) => b.pendingQueue - a.pendingQueue,
      );
      for (const r of busy.slice(0, 5)) {
        findings.push(
          `${r.displayName}: ${r.pendingQueue} pending, ${r.assignedCount} assigned`,
        );
      }
      metrics.totalPending = busy.reduce((s, r) => s + r.pendingQueue, 0);
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: [],
        reviewers: busy,
        payments: [],
        findings,
        metrics,
      };
    }
    case "pending_payments": {
      dataSources.push("payments");
      const pending = facts.payments.filter((p) =>
        [
          "pending",
          "pending_provider",
          "awaiting_payment",
          "processing",
          "initiated",
        ].includes(p.status),
      );
      for (const p of pending.slice(0, 8)) {
        findings.push(
          `${p.publicId}: ${p.status} · ${(p.amountMinor / 100).toFixed(2)} ${facts.currency}`,
        );
      }
      metrics.pendingCount = pending.length;
      metrics.pendingAmountMinor = pending.reduce((s, p) => s + p.amountMinor, 0);
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: [],
        reviewers: [],
        payments: pending,
        findings,
        metrics,
      };
    }
    case "fraud_trends": {
      dataSources.push("fraud_assessments", "campaigns");
      const trends = [...facts.fraudTrends].sort(
        (a, b) => b.highRiskCount - a.highRiskCount || b.avgRiskScore - a.avgRiskScore,
      );
      for (const t of trends.slice(0, 5)) {
        findings.push(
          `${t.campaignName}: ${t.highRiskCount} high-risk · avg score ${t.avgRiskScore}`,
        );
      }
      metrics.campaignsWithFraudSignal = trends.filter((t) => t.highRiskCount > 0)
        .length;
      return {
        intent,
        dataSources,
        campaigns: facts.campaigns.filter((c) =>
          trends.some((t) => t.campaignId === c.id && t.highRiskCount > 0),
        ),
        workers: [],
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "regional_performance": {
      dataSources.push("campaigns", "regions");
      const byRegion = new Map<string, { target: number; completed: number }>();
      for (const c of facts.campaigns) {
        const regions = c.countryScope.length > 0 ? c.countryScope : ["unknown"];
        for (const region of regions) {
          const cur = byRegion.get(region) ?? { target: 0, completed: 0 };
          cur.target += c.targetQuantity;
          cur.completed += c.completedQuantity;
          byRegion.set(region, cur);
        }
      }
      const ranked = [...byRegion.entries()]
        .map(([region, v]) => ({
          region,
          rate: v.target > 0 ? v.completed / v.target : 0,
        }))
        .sort((a, b) => a.rate - b.rate);
      for (const r of ranked.slice(0, 5)) {
        findings.push(
          `${r.region}: ${Math.round(r.rate * 100)}% completion`,
        );
      }
      return {
        intent,
        dataSources,
        campaigns: facts.campaigns,
        workers: [],
        reviewers: [],
        payments: [],
        findings,
        metrics: {
          ...metrics,
          regionCount: ranked.length,
          lowestRegion: ranked[0]?.region ?? "n/a",
        },
      };
    }
    case "organization_spending": {
      dataSources.push("payments", "campaign_budgets");
      findings.push(
        `Quarter spend: ${(facts.spendingThisQuarterMinor / 100).toFixed(2)} ${facts.currency}`,
      );
      const budgetTotal = facts.campaigns.reduce((s, c) => s + c.budgetMinor, 0);
      const spentCampaigns = facts.campaigns.reduce(
        (s, c) => s + c.spentBudgetMinor,
        0,
      );
      findings.push(
        `Campaign spent: ${(spentCampaigns / 100).toFixed(2)} / ${(budgetTotal / 100).toFixed(2)} ${facts.currency}`,
      );
      metrics.spendingThisQuarterMinor = facts.spendingThisQuarterMinor;
      metrics.campaignSpentMinor = spentCampaigns;
      return {
        intent,
        dataSources,
        campaigns: facts.campaigns,
        workers: [],
        reviewers: [],
        payments: facts.payments,
        findings,
        metrics,
      };
    }
    case "inactive_workers": {
      dataSources.push("workers", "assignments");
      const cutoff = Date.now() - 14 * 86_400_000;
      const inactive = facts.workers.filter((w) => {
        if (w.activeAssignments > 0) return false;
        if (!w.lastActivityAt) return true;
        const t = Date.parse(w.lastActivityAt);
        return !Number.isFinite(t) || t < cutoff;
      });
      for (const w of inactive.slice(0, 8)) {
        findings.push(
          `${w.displayName}: last activity ${w.lastActivityAt ?? "unknown"}`,
        );
      }
      metrics.inactiveCount = inactive.length;
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: inactive,
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "highest_trust_workers": {
      dataSources.push("workers", "trust");
      const top = [...facts.workers]
        .filter((w) => w.trustScore != null)
        .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0))
        .slice(0, 8);
      for (const w of top) {
        findings.push(
          `${w.displayName}: trust ${w.trustScore}` +
            (w.trustTrend ? ` · ${w.trustTrend}` : ""),
        );
      }
      if (findings.length === 0) {
        findings.push("No persisted trust profiles yet for org workers.");
      }
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: top,
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "declining_trust": {
      dataSources.push("workers", "trust");
      const declining = facts.workers.filter(
        (w) => w.trustTrend === "declining",
      );
      for (const w of declining.slice(0, 8)) {
        findings.push(
          `${w.displayName}: trust ${w.trustScore ?? "?"} · declining`,
        );
      }
      if (findings.length === 0) findings.push("No workers with declining trust.");
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: declining,
        reviewers: [],
        payments: [],
        findings,
        metrics: { ...metrics, decliningCount: declining.length },
      };
    }
    case "recently_improved_trust": {
      dataSources.push("workers", "trust");
      const rising = facts.workers.filter((w) => w.trustTrend === "improving");
      for (const w of rising.slice(0, 8)) {
        findings.push(
          `${w.displayName}: trust ${w.trustScore ?? "?"} · improving`,
        );
      }
      if (findings.length === 0) findings.push("No workers with improving trust.");
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: rising,
        reviewers: [],
        payments: [],
        findings,
        metrics: { ...metrics, improvingCount: rising.length },
      };
    }
    case "strongest_reliability": {
      dataSources.push("workers", "trust");
      const top = [...facts.workers]
        .filter((w) => w.reliabilityScore != null)
        .sort(
          (a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0),
        )
        .slice(0, 8);
      for (const w of top) {
        findings.push(
          `${w.displayName}: reliability ${w.reliabilityScore}`,
        );
      }
      if (findings.length === 0) {
        findings.push("No reliability scores available yet.");
      }
      return {
        intent,
        dataSources,
        campaigns: [],
        workers: top,
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    case "assignment_backlog": {
      dataSources.push("campaigns", "assignments");
      const active = facts.campaigns.filter(
        (c) => c.status === "active" || c.status === "published",
      );
      for (const c of active.slice(0, 8)) {
        const remaining = Math.max(0, c.targetQuantity - c.completedQuantity);
        if (remaining > 0) {
          findings.push(
            `${c.publicId}: ~${remaining} units remaining`,
          );
        }
      }
      metrics.activeCampaigns = active.length;
      return {
        intent,
        dataSources,
        campaigns: active,
        workers: [],
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
    default: {
      findings.push(
        `${facts.organizationName} has ${facts.campaigns.length} campaigns and ${facts.workers.length} workers in view.`,
      );
      return {
        intent,
        dataSources,
        campaigns: facts.campaigns.slice(0, 3),
        workers: facts.workers.slice(0, 3),
        reviewers: [],
        payments: [],
        findings,
        metrics,
      };
    }
  }
}
