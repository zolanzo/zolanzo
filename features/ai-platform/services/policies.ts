/**
 * AI policy evaluation — disabled / recommendation / human approval / automatic.
 */

import type { AiPolicyMode } from "@/constants/ai";
import { AI_POLICY_MODES } from "@/constants/ai";

export type AiPolicyDecision = {
  mode: AiPolicyMode;
  allowed: boolean;
  executePlugin: boolean;
  applyAutomatically: boolean;
  requiresHumanApproval: boolean;
  reason: string;
};

export function isAiPolicyMode(value: string): value is AiPolicyMode {
  return (AI_POLICY_MODES as readonly string[]).includes(value);
}

export function evaluateAiPolicy(mode: AiPolicyMode): AiPolicyDecision {
  switch (mode) {
    case "disabled":
      return {
        mode,
        allowed: false,
        executePlugin: false,
        applyAutomatically: false,
        requiresHumanApproval: false,
        reason: "AI disabled for this extension point",
      };
    case "recommendation_only":
      return {
        mode,
        allowed: true,
        executePlugin: true,
        applyAutomatically: false,
        requiresHumanApproval: false,
        reason: "Recommendations only — domain state unchanged",
      };
    case "human_approval_required":
      return {
        mode,
        allowed: true,
        executePlugin: true,
        applyAutomatically: false,
        requiresHumanApproval: true,
        reason: "Human must accept/modify/reject via Decision Record",
      };
    case "automatic":
      return {
        mode,
        allowed: true,
        executePlugin: true,
        applyAutomatically: false, // future-ready: never auto-mutate in Sprint 15
        requiresHumanApproval: true,
        reason:
          "Automatic mode future-ready — still recommendation-only until enabled",
      };
  }
}

export function configurationSubjectKey(params: {
  organizationId?: string | null;
  extensionPoint: string;
  pluginKey?: string | null;
}): string {
  const scope = params.organizationId
    ? `org:${params.organizationId}`
    : "global";
  const plugin = params.pluginKey ? `:${params.pluginKey}` : "";
  return `${scope}:${params.extensionPoint}${plugin}`;
}
