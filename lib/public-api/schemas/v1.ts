/**
 * Versioned public schemas (v1) — never mirror internal DTOs 1:1.
 */

export type PublicOrganization = {
  id: string;
  name: string;
  kind: "personal" | "business";
  memberCount: number;
};

export type PublicWorker = {
  id: string;
  displayName: string;
  region: string | null;
  trustBadge: string | null;
};

export type PublicCampaign = {
  id: string;
  title: string;
  status: string;
  organizationId: string;
  region: string | null;
};

export type PublicAssignment = {
  id: string;
  campaignId: string;
  status: string;
  workerId: string | null;
};

export type PublicReviewStatus = {
  id: string;
  assignmentId: string;
  status: "pending" | "approved" | "rejected" | "unknown";
};

export type PublicPaymentStatus = {
  id: string;
  status: string;
  settlementStatus: string;
  amountMinor: number;
  currency: string;
};

export type PublicTrustProfile = {
  subjectId: string;
  overallScore: number;
  trend: string;
  badge: string | null;
  advisoryOnly: true;
};

export type PublicTrustPassport = {
  subjectId: string;
  view: "public" | "org" | "private";
  badges: string[];
  achievements: string[];
};

export type PublicAnalyticsSnapshot = {
  id: string;
  period: string;
  metrics: Record<string, number>;
};

export type PublicForecast = {
  type: string;
  advisoryOnly: true;
  confidence: number;
  modelVersion: string;
  summary: string;
};

export type PublicReport = {
  id: string;
  type: string;
  status: string;
  format: string;
  createdAt: string;
};

export type PublicAutomationRule = {
  id: string;
  publicId: string;
  name: string;
  lifecycle: string;
  trigger: string;
  activeVersion: number | null;
};

export type PublicProfile = {
  principalId: string;
  kind: string;
  organizationId: string | null;
  scopes: string[];
};
