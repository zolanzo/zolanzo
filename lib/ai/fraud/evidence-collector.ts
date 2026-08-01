/**
 * EvidenceCollector — freeze submission evidence into a FraudEvidenceBundle.
 * Pure: no I/O. DB loading lives in FraudAssessmentService.
 */

import type {
  FraudDeviceSnapshot,
  FraudEvidenceBundle,
  FraudEvidenceItemSnapshot,
  FraudGpsSnapshot,
  FraudTimingSnapshot,
} from "@/lib/ai/fraud/fraud-types";

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function parseGpsSnapshot(
  raw: Record<string, unknown> | null | undefined,
): FraudGpsSnapshot | null {
  if (!raw) return null;
  const lat = asNumber(raw.lat ?? raw.latitude);
  const lng = asNumber(raw.lng ?? raw.longitude ?? raw.lon);
  if (lat == null && lng == null) {
    return {
      lat: null,
      lng: null,
      accuracyM: asNumber(raw.accuracyM ?? raw.accuracy),
      capturedAt: asString(raw.capturedAt ?? raw.timestamp),
    };
  }
  return {
    lat,
    lng,
    accuracyM: asNumber(raw.accuracyM ?? raw.accuracy),
    capturedAt: asString(raw.capturedAt ?? raw.timestamp),
  };
}

export function parseDeviceSnapshot(
  raw: Record<string, unknown> | null | undefined,
): FraudDeviceSnapshot | null {
  if (!raw) return null;
  return {
    fingerprint: asString(
      raw.fingerprint ?? raw.deviceFingerprint ?? raw.deviceId,
    ),
    platform: asString(raw.platform ?? raw.os),
    model: asString(raw.model ?? raw.deviceModel),
  };
}

export type CollectEvidenceInput = {
  submissionId: string;
  submissionPublicId?: string | null;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId: string;
  status?: string;
  requiredEvidenceKinds?: string[];
  evidenceItems?: FraudEvidenceItemSnapshot[];
  gpsRaw?: Record<string, unknown> | null;
  deviceRaw?: Record<string, unknown> | null;
  timing?: Partial<FraudTimingSnapshot>;
  campaignCountryScope?: string[];
  campaignCenter?: { lat: number; lng: number } | null;
  campaignRadiusKm?: number | null;
  workerCountryCode?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  historicalRejectionRate?: number;
  priorFraudIndicators?: number;
  duplicateHashMatches?: number;
  sharedDeviceAccountCount?: number;
  recentSubmissionBurst?: number;
  narrativeText?: string | null;
  previousGpsRaw?: Record<string, unknown> | null;
  previousSubmittedAt?: string | null;
};

/** Collect / normalize evidence into an immutable-shaped bundle. */
export function collectFraudEvidence(
  input: CollectEvidenceInput,
): FraudEvidenceBundle {
  return {
    submissionId: input.submissionId,
    submissionPublicId: input.submissionPublicId ?? null,
    organizationId: input.organizationId ?? null,
    campaignId: input.campaignId ?? null,
    workerUserId: input.workerUserId,
    status: input.status ?? "submitted",
    requiredEvidenceKinds: input.requiredEvidenceKinds ?? [],
    evidenceItems: input.evidenceItems ?? [],
    gps: parseGpsSnapshot(input.gpsRaw),
    device: parseDeviceSnapshot(input.deviceRaw),
    timing: {
      timeSpentSeconds: input.timing?.timeSpentSeconds ?? null,
      submittedAt: input.timing?.submittedAt ?? null,
      readyAt: input.timing?.readyAt ?? null,
      createdAt: input.timing?.createdAt ?? null,
    },
    campaignCountryScope: input.campaignCountryScope ?? [],
    campaignCenter: input.campaignCenter ?? null,
    campaignRadiusKm: input.campaignRadiusKm ?? null,
    workerCountryCode: input.workerCountryCode ?? null,
    emailVerified: input.emailVerified ?? false,
    phoneVerified: input.phoneVerified ?? false,
    historicalRejectionRate: input.historicalRejectionRate ?? 0,
    priorFraudIndicators: input.priorFraudIndicators ?? 0,
    duplicateHashMatches: input.duplicateHashMatches ?? 0,
    sharedDeviceAccountCount: input.sharedDeviceAccountCount ?? 0,
    recentSubmissionBurst: input.recentSubmissionBurst ?? 0,
    narrativeText: input.narrativeText ?? null,
    previousGps: parseGpsSnapshot(input.previousGpsRaw),
    previousSubmittedAt: input.previousSubmittedAt ?? null,
  };
}
