/**
 * Phase 3B.4 — Journey certification types.
 * Statuses: PASS | FAIL | BLOCKED (per mission brief).
 */

export type JourneyStatus = "PASS" | "FAIL" | "BLOCKED";

export type JourneyStepResult = {
  id: string;
  name: string;
  status: JourneyStatus;
  evidence: string;
  notes?: string;
};

export type JourneyResult = {
  id: string;
  name: string;
  status: JourneyStatus;
  durationMs: number;
  systemsTouched: string[];
  notificationsExpected: string[];
  auditExpected: string[];
  steps: JourneyStepResult[];
  remainingDefects: string[];
  launchImpact: "none" | "low" | "medium" | "high" | "blocker";
  summary: string;
};

export type CertificationReport = {
  generatedAt: string;
  mode: "path_contract" | "live_session";
  databaseReachable: boolean;
  providerKeys: {
    paystack: boolean;
    resend: boolean;
    sendchamp: boolean;
  };
  journeys: JourneyResult[];
  businessWorkflowReadiness: number;
  criticalPass: boolean;
  recommendation: "pilot_launch" | "conditional_pilot" | "hold";
  recommendationRationale: string;
};
