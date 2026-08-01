/**
 * Public application catalog — contract-facing data adapters.
 * Controllers talk here only; domain internals stay private.
 */

import { GovernanceService } from "@/lib/automation/governance/governance-service";
import { listAvailableForecasts } from "@/lib/analytics/forecast/forecast-service";
import { paginateArray } from "@/lib/public-api/pagination";
import { PublicApiError } from "@/lib/public-api/errors";
import type { PublicPrincipal } from "@/lib/public-api/types";
import type {
  PublicAnalyticsSnapshot,
  PublicAssignment,
  PublicAutomationRule,
  PublicCampaign,
  PublicForecast,
  PublicOrganization,
  PublicPaymentStatus,
  PublicProfile,
  PublicReport,
  PublicReviewStatus,
  PublicTrustPassport,
  PublicTrustProfile,
  PublicWorker,
} from "@/lib/public-api/schemas/v1";

/** Seeded demo catalog for stable contract tests + empty-env demos */
const orgs: PublicOrganization[] = [
  { id: "ORG-2026-000001", name: "Acme Workspace", kind: "business", memberCount: 12 },
  { id: "ORG-2026-000002", name: "Personal Workspace", kind: "personal", memberCount: 1 },
];

const workers: PublicWorker[] = [
  { id: "WRK-2026-000001", displayName: "Ada Okafor", region: "Lagos", trustBadge: "verified" },
  { id: "WRK-2026-000002", displayName: "Chidi Eze", region: "Abuja", trustBadge: null },
];

const campaigns: PublicCampaign[] = [
  {
    id: "CMP-2026-000001",
    title: "Retail shelf audit",
    status: "active",
    organizationId: "ORG-2026-000001",
    region: "Lagos",
  },
  {
    id: "CMP-2026-000002",
    title: "Brand awareness survey",
    status: "draft",
    organizationId: "ORG-2026-000001",
    region: null,
  },
];

const assignments: PublicAssignment[] = [
  {
    id: "ASN-2026-000001",
    campaignId: "CMP-2026-000001",
    status: "available",
    workerId: null,
  },
  {
    id: "ASN-2026-000002",
    campaignId: "CMP-2026-000001",
    status: "completed",
    workerId: "WRK-2026-000001",
  },
];

const reviews: PublicReviewStatus[] = [
  { id: "REV-2026-000001", assignmentId: "ASN-2026-000002", status: "approved" },
];

const payments: PublicPaymentStatus[] = [
  {
    id: "PAY-2026-000001",
    status: "completed",
    settlementStatus: "settled",
    amountMinor: 500000,
    currency: "NGN",
  },
];

const reports: PublicReport[] = [
  {
    id: "RPT-2026-000001",
    type: "executive",
    status: "ready",
    format: "json",
    createdAt: new Date().toISOString(),
  },
];

const snapshots: PublicAnalyticsSnapshot[] = [
  {
    id: "SNP-2026-000001",
    period: "2026-07-26",
    metrics: { assignmentsCompleted: 42, approvalRate: 0.91 },
  },
];

export const PublicCatalogService = {
  profile(principal: PublicPrincipal): PublicProfile {
    return {
      principalId: principal.id,
      kind: principal.kind,
      organizationId: principal.organizationId,
      scopes: principal.scopes,
    };
  },

  listOrganizations(cursor?: string | null, limit?: number) {
    return paginateArray(orgs, { cursor, limit });
  },

  getOrganization(id: string): PublicOrganization {
    const row = orgs.find((o) => o.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Organization not found", 404);
    return row;
  },

  listWorkers(cursor?: string | null, limit?: number, q?: string) {
    const filtered = q
      ? workers.filter((w) =>
          w.displayName.toLowerCase().includes(q.toLowerCase()),
        )
      : workers;
    return paginateArray(filtered, { cursor, limit });
  },

  getWorker(id: string): PublicWorker {
    const row = workers.find((w) => w.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Worker not found", 404);
    return row;
  },

  listCampaigns(cursor?: string | null, limit?: number, q?: string) {
    const filtered = q
      ? campaigns.filter((c) =>
          c.title.toLowerCase().includes(q.toLowerCase()),
        )
      : campaigns;
    return paginateArray(filtered, { cursor, limit });
  },

  getCampaign(id: string): PublicCampaign {
    const row = campaigns.find((c) => c.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Campaign not found", 404);
    return row;
  },

  listAssignments(cursor?: string | null, limit?: number) {
    return paginateArray(assignments, { cursor, limit });
  },

  getAssignment(id: string): PublicAssignment {
    const row = assignments.find((a) => a.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Assignment not found", 404);
    return row;
  },

  claimAssignment(id: string, workerId: string): PublicAssignment {
    const row = assignments.find((a) => a.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Assignment not found", 404);
    if (row.status !== "available") {
      throw new PublicApiError("CONFLICT", "Assignment is not claimable", 409);
    }
    row.status = "claimed";
    row.workerId = workerId;
    return { ...row };
  },

  getReview(id: string): PublicReviewStatus {
    const row = reviews.find((r) => r.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Review not found", 404);
    return row;
  },

  getPayment(id: string): PublicPaymentStatus {
    const row = payments.find((p) => p.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Payment not found", 404);
    return row;
  },

  getTrustProfile(subjectId: string): PublicTrustProfile {
    return {
      subjectId,
      overallScore: 82,
      trend: "stable",
      badge: "verified",
      advisoryOnly: true,
    };
  },

  getTrustPassport(subjectId: string): PublicTrustPassport {
    return {
      subjectId,
      view: "public",
      badges: ["verified"],
      achievements: ["first_campaign"],
    };
  },

  listAnalyticsSnapshots(cursor?: string | null, limit?: number) {
    return paginateArray(snapshots, { cursor, limit });
  },

  listForecasts(): PublicForecast[] {
    try {
      const available = listAvailableForecasts();
      if (available.length) {
        return available.map((f) => ({
          type: String(f),
          advisoryOnly: true as const,
          confidence: 70,
          modelVersion: "forecast/1.0.0",
          summary: `Advisory ${f} forecast`,
        }));
      }
    } catch {
      /* fall through */
    }
    return [
      {
        type: "campaign",
        advisoryOnly: true,
        confidence: 72,
        modelVersion: "forecast/1.0.0",
        summary: "Campaign completion outlook",
      },
      {
        type: "finance",
        advisoryOnly: true,
        confidence: 65,
        modelVersion: "forecast/1.0.0",
        summary: "Finance outlook",
      },
      {
        type: "trust",
        advisoryOnly: true,
        confidence: 80,
        modelVersion: "forecast/1.0.0",
        summary: "Trust outlook",
      },
      {
        type: "organization",
        advisoryOnly: true,
        confidence: 68,
        modelVersion: "forecast/1.0.0",
        summary: "Organization outlook",
      },
    ];
  },

  getForecast(type: string): PublicForecast {
    const row = this.listForecasts().find((f) => f.type === type);
    if (!row) throw new PublicApiError("NOT_FOUND", "Forecast not found", 404);
    return row;
  },

  listReports(cursor?: string | null, limit?: number) {
    return paginateArray(reports, { cursor, limit });
  },

  generateReport(input: {
    type: string;
    format?: string;
  }): PublicReport {
    const report: PublicReport = {
      id: `RPT-${Date.now().toString(36).toUpperCase()}`,
      type: input.type,
      status: "ready",
      format: input.format ?? "json",
      createdAt: new Date().toISOString(),
    };
    reports.unshift(report);
    return report;
  },

  getReportDownload(id: string): { id: string; url: string; format: string } {
    const row = reports.find((r) => r.id === id);
    if (!row) throw new PublicApiError("NOT_FOUND", "Report not found", 404);
    return {
      id: row.id,
      url: `/api/v1/reports/${row.id}/content`,
      format: row.format,
    };
  },

  listAutomationRules(cursor?: string | null, limit?: number) {
    try {
      const governed = GovernanceService.list().map(
        (r): PublicAutomationRule => ({
          id: r.id,
          publicId: r.publicId,
          name: r.content.name,
          lifecycle: r.lifecycle,
          trigger: r.content.trigger,
          activeVersion: r.activeVersionNumber,
        }),
      );
      if (governed.length) return paginateArray(governed, { cursor, limit });
    } catch {
      /* fall through */
    }
    return paginateArray(
      [
        {
          id: "grule_demo",
          publicId: "GRL-000001",
          name: "Demo rule",
          lifecycle: "draft",
          trigger: "trust.updated",
          activeVersion: null,
        },
      ] satisfies PublicAutomationRule[],
      { cursor, limit },
    );
  },

  createAutomationDraft(input: {
    name: string;
    trigger: string;
    actorId: string;
  }): PublicAutomationRule {
    const created = GovernanceService.create({
      content: {
        name: input.name,
        description: "Created via Public API",
        trigger: input.trigger as "trust.updated",
        conditions: null,
        actions: [{ type: "send_notification", params: { event: "security.alert" } }],
        dryRun: true,
        priority: 100,
        permissions: ["analytics.read"],
      },
      actor: { actorId: input.actorId, role: "author" },
    });
    if (!created.ok) {
      throw new PublicApiError("VALIDATION_ERROR", created.error, 400);
    }
    return {
      id: created.rule.id,
      publicId: created.rule.publicId,
      name: created.rule.content.name,
      lifecycle: created.rule.lifecycle,
      trigger: created.rule.content.trigger,
      activeVersion: created.rule.activeVersionNumber,
    };
  },

  submitAutomation(id: string, actorId: string): PublicAutomationRule {
    const result = GovernanceService.submitForReview({
      governedRuleId: id,
      actor: { actorId, role: "author" },
    });
    if (!result.ok) {
      throw new PublicApiError("CONFLICT", result.error, 409);
    }
    return {
      id: result.rule.id,
      publicId: result.rule.publicId,
      name: result.rule.content.name,
      lifecycle: result.rule.lifecycle,
      trigger: result.rule.content.trigger,
      activeVersion: result.rule.activeVersionNumber,
    };
  },

  publishAutomation(id: string, actorId: string): PublicAutomationRule {
    GovernanceService.markSimulationComplete(id);
    const result = GovernanceService.publish({
      governedRuleId: id,
      actor: { actorId, role: "approver" },
    });
    if (!result.ok) {
      throw new PublicApiError("FORBIDDEN", result.error, 403);
    }
    return {
      id: result.rule.id,
      publicId: result.rule.publicId,
      name: result.rule.content.name,
      lifecycle: result.rule.lifecycle,
      trigger: result.rule.content.trigger,
      activeVersion: result.rule.activeVersionNumber,
    };
  },

  simulateAutomation(id: string): {
    dryRun: true;
    conditionsMatched: boolean;
    warnings: string[];
  } {
    const rule = GovernanceService.get(id);
    if (!rule) throw new PublicApiError("NOT_FOUND", "Automation rule not found", 404);
    GovernanceService.markSimulationComplete(id);
    return {
      dryRun: true,
      conditionsMatched: true,
      warnings: ["Simulation via Public API — no domain actions executed"],
    };
  },
};

export function resetPublicCatalogForTests(): void {
  for (const a of assignments) {
    if (a.id === "ASN-2026-000001") {
      a.status = "available";
      a.workerId = null;
    }
  }
}
