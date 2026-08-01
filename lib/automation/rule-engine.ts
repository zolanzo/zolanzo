/**
 * RuleEngine — select matching enabled rules for a trigger + conditions.
 */

import { isAutomationRulesEnabled } from "@/lib/automation/config";
import { evaluateConditionGroup } from "@/lib/automation/condition-evaluator";
import { listRules } from "@/lib/automation/store";
import type {
  AutomationEvent,
  AutomationRule,
} from "@/lib/automation/types";

export function buildEvaluationContext(
  event: AutomationEvent,
): Record<string, unknown> {
  const now = new Date(event.occurredAt);
  return {
    ...event.payload,
    organizationId: event.organizationId ?? event.payload.organizationId,
    campaignId: event.campaignId ?? event.payload.campaignId,
    userId: event.userId ?? event.payload.userId,
    trigger: event.trigger,
    correlationId: event.correlationId,
    date: {
      iso: event.occurredAt,
      hour: now.getUTCHours(),
      dayOfWeek: now.getUTCDay(),
      date: event.occurredAt.slice(0, 10),
    },
    paymentStatus: event.payload.paymentStatus,
    trustScore: event.payload.trustScore,
    approvalRate: event.payload.approvalRate,
    assignmentCount: event.payload.assignmentCount,
    forecastConfidence: event.payload.confidence ?? event.payload.forecastConfidence,
    region: event.payload.region,
  };
}

export function selectMatchingRules(
  event: AutomationEvent,
): AutomationRule[] {
  if (!isAutomationRulesEnabled()) return [];
  const candidates = listRules({
    trigger: event.trigger,
    enabled: true,
    organizationId: event.organizationId,
  });
  const ctx = buildEvaluationContext(event);
  return candidates.filter((rule) =>
    evaluateConditionGroup(rule.conditions, ctx),
  );
}

export const RuleEngine = {
  selectMatchingRules,
  buildEvaluationContext,
};
