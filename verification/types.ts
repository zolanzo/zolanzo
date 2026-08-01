/**
 * Production verification suite — types.
 * Statuses: pass | fail | warn | blocked | skip
 */

export type VerifyStatus = "pass" | "fail" | "warn" | "blocked" | "skip";

export type VerifyCheck = {
  id: string;
  name: string;
  category: "workflow" | "infrastructure";
  status: VerifyStatus;
  durationMs: number;
  evidence: string;
  notes?: string;
};

export type VerifyPerformanceSample = {
  id: string;
  durationMs: number;
  budgetMs: number;
  withinBudget: boolean;
};

export type ProductionVerificationReport = {
  generatedAt: string;
  mode: "automated_suite";
  databaseReachable: boolean;
  providerKeys: {
    paystack: boolean;
    resend: boolean;
    sendchamp: boolean;
  };
  workflows: VerifyCheck[];
  infrastructure: VerifyCheck[];
  failures: VerifyCheck[];
  warnings: VerifyCheck[];
  performance: VerifyPerformanceSample[];
  recommendations: string[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
    blocked: number;
    skipped: number;
    readinessScore: number;
    verdict: "ready" | "conditional" | "not_ready";
    healthScores?: {
      production: number;
      workflow: number;
      infrastructure: number;
      api: number;
      security: number;
    };
  };
};
