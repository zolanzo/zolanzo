/**
 * Command Center — live operations dashboard snapshot.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { collectOperationalMetrics } from "@/features/admin/services/metrics";
import {
  buildAllViews,
  buildQueueHealth,
  type OperationalView,
  type QueueHealthItem,
} from "@/features/admin/services/operational-views";
import { BUILTIN_PLAYBOOKS } from "@/features/admin/services/playbooks";
import { getHealthDashboard, type HealthDashboard } from "@/features/admin/services/health";
import {
  getPaymentHealthSnapshot,
  type PaymentHealthSnapshot,
} from "@/features/admin/services/payment-health";
import {
  getEmailHealthSnapshot,
  type EmailHealthSnapshot,
} from "@/features/admin/services/email-health";
import {
  getCommunicationHealthSnapshot,
  type CommunicationHealthSnapshot,
} from "@/features/admin/services/communication-health";
import {
  getStorageHealthSnapshot,
  type StorageHealthSnapshot,
} from "@/features/admin/services/storage-health";
import {
  getAiHealthSnapshot,
  type AiHealthSnapshot,
} from "@/features/admin/services/ai-health";
import {
  getRankingHealthSnapshot,
  type RankingHealthSnapshot,
} from "@/features/admin/services/ranking-health";
import {
  getFraudHealthSnapshot,
  type FraudHealthSnapshot,
} from "@/features/admin/services/fraud-health";
import {
  getReviewAssistantHealthSnapshot,
  type ReviewAssistantHealthSnapshot,
} from "@/features/admin/services/review-assistant-health";
import {
  getOrgCopilotHealthSnapshot,
  type OrgCopilotHealthSnapshot,
} from "@/features/admin/services/org-copilot-health";
import {
  getWorkerCopilotHealthSnapshot,
  type WorkerCopilotHealthSnapshot,
} from "@/features/admin/services/worker-copilot-health";
import {
  getTrustHealthSnapshot,
  type TrustHealthSnapshot,
} from "@/features/admin/services/trust-health";
import {
  getPassportHealthSnapshot,
  type PassportHealthSnapshot,
} from "@/features/admin/services/passport-health";
import {
  getAnalyticsHealthSnapshot,
  type AnalyticsHealthSnapshot,
} from "@/features/admin/services/analytics-health";
import {
  getDashboardHealthSnapshot,
  type DashboardHealthSnapshot,
} from "@/features/admin/services/dashboard-health";
import {
  getForecastHealthSnapshot,
  type ForecastHealthSnapshot,
} from "@/features/admin/services/forecast-health";
import {
  getReportsHealthSnapshot,
  type ReportsHealthSnapshot,
} from "@/features/admin/services/reports-health";
import {
  getAutomationHealthSnapshot,
  type AutomationHealthSnapshot,
} from "@/features/admin/services/automation-health";
import {
  getAutomationLibraryHealthSnapshot,
  type AutomationLibraryHealthSnapshot,
} from "@/features/admin/services/automation-library-health";
import {
  getRuleBuilderHealthSnapshot,
  type RuleBuilderHealthSnapshot,
} from "@/features/admin/services/rule-builder-health";
import {
  getAutomationGovernanceHealthSnapshot,
  type AutomationGovernanceHealthSnapshot,
} from "@/features/admin/services/automation-governance-health";
import {
  getPublicApiHealthSnapshot,
  type PublicApiHealthSnapshot,
} from "@/features/admin/services/public-api-health";
import {
  getWebhookHealthSnapshot,
  type WebhookHealthSnapshot,
} from "@/features/admin/services/webhook-health";
import {
  getIntegrationMarketplaceHealthSnapshot,
  type IntegrationMarketplaceHealthSnapshot,
} from "@/features/admin/services/integration-marketplace-health";
import {
  getDeveloperPortalHealthSnapshot,
  type DeveloperPortalHealthSnapshot,
} from "@/features/admin/services/developer-portal-health";
import type { Role } from "@/constants/roles";
import { canReadCommandCenter } from "@/features/admin/services/rbac-operations";

export type AttentionItem = {
  severity: "watch" | "breach";
  queue: string;
  message: string;
};

export type CommandCenterSnapshot = {
  generatedAt: string;
  overview: OperationalView;
  queues: QueueHealthItem[];
  attention: AttentionItem[];
  health: HealthDashboard;
  paymentHealth: PaymentHealthSnapshot;
  emailHealth: EmailHealthSnapshot;
  communicationHealth: CommunicationHealthSnapshot;
  storageHealth: StorageHealthSnapshot;
  aiHealth: AiHealthSnapshot;
  rankingHealth: RankingHealthSnapshot;
  fraudHealth: FraudHealthSnapshot;
  reviewAssistantHealth: ReviewAssistantHealthSnapshot;
  orgCopilotHealth: OrgCopilotHealthSnapshot;
  workerCopilotHealth: WorkerCopilotHealthSnapshot;
  trustHealth: TrustHealthSnapshot;
  passportHealth: PassportHealthSnapshot;
  analyticsHealth: AnalyticsHealthSnapshot;
  dashboardHealth: DashboardHealthSnapshot;
  forecastHealth: ForecastHealthSnapshot;
  reportsHealth: ReportsHealthSnapshot;
  automationHealth: AutomationHealthSnapshot;
  automationLibraryHealth: AutomationLibraryHealthSnapshot;
  ruleBuilderHealth: RuleBuilderHealthSnapshot;
  automationGovernanceHealth: AutomationGovernanceHealthSnapshot;
  publicApiHealth: PublicApiHealthSnapshot;
  webhookHealth: WebhookHealthSnapshot;
  integrationMarketplaceHealth: IntegrationMarketplaceHealthSnapshot;
  developerPortalHealth: DeveloperPortalHealthSnapshot;
  playbookHints: Array<{ key: string; title: string; queueKey: string }>;
  views: Record<string, OperationalView>;
};

function buildAttention(queues: QueueHealthItem[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const q of queues) {
    if (q.sla === "breach") {
      items.push({
        severity: "breach",
        queue: q.queue,
        message: `${q.queue} queue needs attention (${q.failed} failed, ${q.aged} aged, ${q.pending} pending)`,
      });
    } else if (q.sla === "watch") {
      items.push({
        severity: "watch",
        queue: q.queue,
        message: `${q.queue} queue elevated (${q.pending} pending)`,
      });
    }
  }
  return items;
}

export async function getCommandCenter(params: {
  platformRoles: readonly Role[];
  persistSnapshot?: boolean;
}): Promise<ApiResponse<CommandCenterSnapshot>> {
  try {
    if (!canReadCommandCenter(params.platformRoles)) {
      throw new AppError("FORBIDDEN", "Missing ops.command_center.read", 403);
    }

    // Serve unexpired snapshot when present — same payload shape, no logic change.
    if (params.persistSnapshot !== false) {
      const cached = await prisma.dashboardSnapshot.findUnique({
        where: { key: "command_center" },
      });
      if (
        cached?.expiresAt &&
        cached.expiresAt.getTime() > Date.now() &&
        cached.payload &&
        typeof cached.payload === "object"
      ) {
        return apiSuccess(cached.payload as unknown as CommandCenterSnapshot);
      }
    }

    const metrics = await collectOperationalMetrics();
    const views = buildAllViews(metrics);
    const queues = buildQueueHealth(metrics);
    const [
      health,
      paymentHealth,
      emailHealth,
      communicationHealth,
      storageHealth,
      aiHealth,
      rankingHealth,
      fraudHealth,
      reviewAssistantHealth,
      orgCopilotHealth,
      workerCopilotHealth,
      trustHealth,
      passportHealth,
      analyticsHealth,
      dashboardHealth,
      forecastHealth,
      reportsHealth,
      automationHealth,
      automationLibraryHealth,
      ruleBuilderHealth,
      automationGovernanceHealth,
      publicApiHealth,
      webhookHealth,
      integrationMarketplaceHealth,
      developerPortalHealth,
    ] = await Promise.all([
      getHealthDashboard(),
      getPaymentHealthSnapshot(),
      getEmailHealthSnapshot(),
      getCommunicationHealthSnapshot(),
      getStorageHealthSnapshot(),
      getAiHealthSnapshot({ runProbe: true }),
      getRankingHealthSnapshot(),
      getFraudHealthSnapshot(),
      getReviewAssistantHealthSnapshot(),
      getOrgCopilotHealthSnapshot(),
      getWorkerCopilotHealthSnapshot(),
      getTrustHealthSnapshot(),
      getPassportHealthSnapshot(),
      getAnalyticsHealthSnapshot(),
      getDashboardHealthSnapshot(),
      getForecastHealthSnapshot(),
      getReportsHealthSnapshot(),
      getAutomationHealthSnapshot(),
      getAutomationLibraryHealthSnapshot(),
      getRuleBuilderHealthSnapshot(),
      getAutomationGovernanceHealthSnapshot(),
      getPublicApiHealthSnapshot(),
      getWebhookHealthSnapshot(),
      getIntegrationMarketplaceHealthSnapshot(),
      getDeveloperPortalHealthSnapshot(),
    ]);
    const attention = buildAttention(queues);
    if (paymentHealth.reconciliation.status === "mismatches") {
      attention.push({
        severity: "breach",
        queue: "payment",
        message: `Paystack reconciliation has ${paymentHealth.reconciliation.mismatchCount} mismatch(es)`,
      });
    } else if (paymentHealth.pendingCallbacks > 0) {
      attention.push({
        severity: "watch",
        queue: "payment",
        message: `${paymentHealth.pendingCallbacks} payment(s) awaiting callback/webhook >15m`,
      });
    }
    if (emailHealth.deadLettered > 0) {
      attention.push({
        severity: "breach",
        queue: "notification",
        message: `${emailHealth.deadLettered} email job(s) in dead letter`,
      });
    } else if (emailHealth.failures > 0) {
      attention.push({
        severity: "watch",
        queue: "notification",
        message: `${emailHealth.failures} email failure(s) / dead-letter candidates`,
      });
    }
    if (communicationHealth.providerStatus === "circuit_open") {
      attention.push({
        severity: "breach",
        queue: "notification",
        message: "Sendchamp circuit breaker is open",
      });
    } else if (communicationHealth.deadLettered > 0) {
      attention.push({
        severity: "breach",
        queue: "notification",
        message: `${communicationHealth.deadLettered} SMS/WhatsApp job(s) in dead letter`,
      });
    }
    if (storageHealth.failures > 0) {
      attention.push({
        severity: "watch",
        queue: "storage",
        message: "Storage provider probe reported failures",
      });
    } else if (storageHealth.orphanCandidates > 50) {
      attention.push({
        severity: "watch",
        queue: "storage",
        message: `${storageHealth.orphanCandidates} memory-backed evidence refs while live storage available`,
      });
    }
    if (!aiHealth.probe.ok) {
      attention.push({
        severity: "watch",
        queue: "ai",
        message: `AI health probe failed: ${aiHealth.probe.error ?? "unknown"}`,
      });
    } else if (aiHealth.failures > 0 && aiHealth.failures >= Math.max(3, aiHealth.requests * 0.2)) {
      attention.push({
        severity: "watch",
        queue: "ai",
        message: `AI elevated failure rate (${aiHealth.failures}/${aiHealth.requests})`,
      });
    }
    if (rankingHealth.failures > 0 && rankingHealth.failures >= Math.max(3, rankingHealth.requests * 0.25)) {
      attention.push({
        severity: "watch",
        queue: "ranking",
        message: `Match engine elevated failures (${rankingHealth.failures}/${rankingHealth.requests})`,
      });
    } else if (rankingHealth.fallbackRate > 0.5 && rankingHealth.requests >= 5) {
      attention.push({
        severity: "watch",
        queue: "ranking",
        message: `Match engine high fallback rate (${Math.round(rankingHealth.fallbackRate * 100)}%)`,
      });
    }
    if (fraudHealth.highRiskCount >= 10) {
      attention.push({
        severity: "watch",
        queue: "fraud",
        message: `${fraudHealth.highRiskCount} high-risk fraud assessments in window`,
      });
    } else if (fraudHealth.failures > 0 && fraudHealth.failures >= Math.max(3, fraudHealth.requests * 0.25)) {
      attention.push({
        severity: "watch",
        queue: "fraud",
        message: `Fraud engine elevated failures (${fraudHealth.failures}/${fraudHealth.requests})`,
      });
    }
    if (
      reviewAssistantHealth.failures > 0 &&
      reviewAssistantHealth.failures >=
        Math.max(3, reviewAssistantHealth.requests * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "review_assistant",
        message: `Review assistant elevated failures (${reviewAssistantHealth.failures}/${reviewAssistantHealth.requests})`,
      });
    }
    if (
      orgCopilotHealth.failures > 0 &&
      orgCopilotHealth.failures >= Math.max(3, orgCopilotHealth.requests * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "org_copilot",
        message: `Org Copilot elevated failures (${orgCopilotHealth.failures}/${orgCopilotHealth.requests})`,
      });
    } else if (orgCopilotHealth.errorRate > 0.2 && orgCopilotHealth.requests >= 5) {
      attention.push({
        severity: "watch",
        queue: "org_copilot",
        message: `Org Copilot error rate ${Math.round(orgCopilotHealth.errorRate * 100)}%`,
      });
    }
    if (
      workerCopilotHealth.failures > 0 &&
      workerCopilotHealth.failures >=
        Math.max(3, workerCopilotHealth.requests * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "worker_copilot",
        message: `Worker Copilot elevated failures (${workerCopilotHealth.failures}/${workerCopilotHealth.requests})`,
      });
    } else if (
      workerCopilotHealth.errorRate > 0.2 &&
      workerCopilotHealth.requests >= 5
    ) {
      attention.push({
        severity: "watch",
        queue: "worker_copilot",
        message: `Worker Copilot error rate ${Math.round(workerCopilotHealth.errorRate * 100)}%`,
      });
    }
    if (
      trustHealth.failures > 0 &&
      trustHealth.failures >= Math.max(3, trustHealth.recalculations * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "trust",
        message: `Trust engine elevated failures (${trustHealth.failures}/${trustHealth.recalculations})`,
      });
    } else if (trustHealth.fallingTrust >= 10 && trustHealth.recalculations >= 5) {
      attention.push({
        severity: "watch",
        queue: "trust",
        message: `${trustHealth.fallingTrust} declining trust recalculation(s)`,
      });
    }
    if (analyticsHealth.deadLetter > 0) {
      attention.push({
        severity: "breach",
        queue: "analytics",
        message: `${analyticsHealth.deadLetter} analytics event(s) in dead letter`,
      });
    } else if (
      analyticsHealth.failedEvents > 0 &&
      analyticsHealth.failedEvents >= Math.max(3, analyticsHealth.eventsTotal * 0.05)
    ) {
      attention.push({
        severity: "watch",
        queue: "analytics",
        message: `${analyticsHealth.failedEvents} failed analytics event(s)`,
      });
    }
    if (
      dashboardHealth.widgetFailures > 0 &&
      dashboardHealth.widgetFailures >= Math.max(3, dashboardHealth.builds * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "dashboards",
        message: `${dashboardHealth.widgetFailures} dashboard widget failure(s)`,
      });
    } else if (
      dashboardHealth.averageRenderLatencyMs > 2000 &&
      dashboardHealth.builds >= 3
    ) {
      attention.push({
        severity: "watch",
        queue: "dashboards",
        message: `Dashboard avg render ${dashboardHealth.averageRenderLatencyMs} ms`,
      });
    }
    if (forecastHealth.failures > 0 && forecastHealth.failures >= Math.max(3, forecastHealth.jobs * 0.25)) {
      attention.push({
        severity: "watch",
        queue: "forecast",
        message: `Forecast elevated failures (${forecastHealth.failures}/${forecastHealth.jobs})`,
      });
    }
    if (
      reportsHealth.failures > 0 &&
      reportsHealth.failures >=
        Math.max(3, (reportsHealth.reportsGenerated || 1) * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "reports",
        message: `${reportsHealth.failures} report/export failure(s)`,
      });
    }
    if (automationHealth.deadLetter > 0) {
      attention.push({
        severity: "breach",
        queue: "automation",
        message: `${automationHealth.deadLetter} automation execution(s) in DLQ`,
      });
    } else if (
      automationHealth.failures > 0 &&
      automationHealth.failures >=
        Math.max(3, automationHealth.executions * 0.25)
    ) {
      attention.push({
        severity: "watch",
        queue: "automation",
        message: `Automation elevated failures (${automationHealth.failures}/${automationHealth.executions})`,
      });
    }
    if (automationLibraryHealth.failedTemplateExecutions > 0) {
      attention.push({
        severity: "watch",
        queue: "automation_library",
        message: `${automationLibraryHealth.failedTemplateExecutions} automation template failure(s)`,
      });
    }
    if (
      ruleBuilderHealth.validationFailures > 0 &&
      ruleBuilderHealth.validationFailures >=
        Math.max(5, ruleBuilderHealth.rulesCreated)
    ) {
      attention.push({
        severity: "watch",
        queue: "rule_builder",
        message: `Elevated rule builder validation failures (${ruleBuilderHealth.validationFailures})`,
      });
    }
    if (automationGovernanceHealth.pendingApprovals > 0) {
      attention.push({
        severity: "watch",
        queue: "automation_governance",
        message: `${automationGovernanceHealth.pendingApprovals} automation approval(s) pending`,
      });
    }
    if (automationGovernanceHealth.policyViolations > 5) {
      attention.push({
        severity: "watch",
        queue: "automation_governance",
        message: `${automationGovernanceHealth.policyViolations} automation policy violation(s)`,
      });
    }
    if (
      publicApiHealth.errorRate >= 0.25 &&
      publicApiHealth.requestsPerMinute >= 10
    ) {
      attention.push({
        severity: "watch",
        queue: "public_api",
        message: `Public API elevated error rate (${Math.round(publicApiHealth.errorRate * 100)}%)`,
      });
    }
    if (publicApiHealth.rateLimitedRequests > 20) {
      attention.push({
        severity: "watch",
        queue: "public_api",
        message: `${publicApiHealth.rateLimitedRequests} public API rate-limit hit(s)`,
      });
    }
    if (webhookHealth.deadLetterQueue > 0) {
      attention.push({
        severity: "breach",
        queue: "webhooks",
        message: `${webhookHealth.deadLetterQueue} webhook delivery(ies) in DLQ`,
      });
    } else if (
      webhookHealth.successRate < 0.8 &&
      webhookHealth.deliveriesPerMinute >= 5
    ) {
      attention.push({
        severity: "watch",
        queue: "webhooks",
        message: `Webhook success rate low (${Math.round(webhookHealth.successRate * 100)}%)`,
      });
    }
    if (integrationMarketplaceHealth.authenticationFailures > 5) {
      attention.push({
        severity: "watch",
        queue: "integrations",
        message: `${integrationMarketplaceHealth.authenticationFailures} connector auth failure(s)`,
      });
    }
    if (integrationMarketplaceHealth.syncFailures > 5) {
      attention.push({
        severity: "watch",
        queue: "integrations",
        message: `${integrationMarketplaceHealth.syncFailures} connector sync failure(s)`,
      });
    }
    if (developerPortalHealth.brokenExamples > 0) {
      attention.push({
        severity: "watch",
        queue: "developer_portal",
        message: `${developerPortalHealth.brokenExamples} broken developer example(s)`,
      });
    }
    if (
      developerPortalHealth.documentationCoverage < 1 &&
      developerPortalHealth.portalEnabled
    ) {
      attention.push({
        severity: "watch",
        queue: "developer_portal",
        message: `Documentation coverage ${Math.round(developerPortalHealth.documentationCoverage * 100)}%`,
      });
    }

    const snapshot: CommandCenterSnapshot = {
      generatedAt: new Date().toISOString(),
      overview: views.platform_overview,
      queues,
      attention,
      health,
      paymentHealth,
      emailHealth,
      communicationHealth,
      storageHealth,
      aiHealth,
      rankingHealth,
      fraudHealth,
      reviewAssistantHealth,
      orgCopilotHealth,
      workerCopilotHealth,
      trustHealth,
      passportHealth,
      analyticsHealth,
      dashboardHealth,
      forecastHealth,
      reportsHealth,
      automationHealth,
      automationLibraryHealth,
      ruleBuilderHealth,
      automationGovernanceHealth,
      publicApiHealth,
      webhookHealth,
      integrationMarketplaceHealth,
      developerPortalHealth,
      playbookHints: BUILTIN_PLAYBOOKS.map((p) => ({
        key: p.key,
        title: p.title,
        queueKey: p.queueKey,
      })),
      views,
    };

    if (params.persistSnapshot !== false) {
      await prisma.dashboardSnapshot.upsert({
        where: { key: "command_center" },
        create: {
          key: "command_center",
          payload: snapshot as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
        update: {
          payload: snapshot as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
    }

    return apiSuccess(snapshot);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "COMMAND_CENTER_FAILED",
      error instanceof Error ? error.message : "Could not build command center",
    );
  }
}
