/**
 * RuleRiskEngine — deterministic fraud signals (always runs).
 */

import {
  isDuplicateAnalysisEnabled,
  isGeoAnalysisEnabled,
} from "@/lib/ai/fraud/fraud-config";
import type {
  FraudEvidenceBundle,
  FraudRiskFinding,
} from "@/lib/ai/fraud/fraud-types";

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type RuleRiskResult = {
  findings: FraudRiskFinding[];
  ruleScore: number;
};

/**
 * Evaluate rule-based risk findings. Score is sum of deltas clamped 0–100.
 */
export function evaluateRuleRisk(
  bundle: FraudEvidenceBundle,
  options?: {
    duplicateAnalysis?: boolean;
    geoAnalysis?: boolean;
  },
): RuleRiskResult {
  const findings: FraudRiskFinding[] = [];
  const duplicateOn = options?.duplicateAnalysis ?? isDuplicateAnalysisEnabled();
  const geoOn = options?.geoAnalysis ?? isGeoAnalysisEnabled();

  // Identity
  if (!bundle.emailVerified && !bundle.phoneVerified) {
    findings.push({
      code: "identity_unverified",
      label: "Identity not verified",
      delta: 12,
      severity: "medium",
      source: "rule",
      signal: false,
    });
  } else if (!bundle.emailVerified || !bundle.phoneVerified) {
    findings.push({
      code: "identity_partial",
      label: "Partial identity verification",
      delta: 4,
      severity: "low",
      source: "rule",
    });
  }

  // Device consistency / shared device
  if (!bundle.device?.fingerprint) {
    findings.push({
      code: "device_missing",
      label: "Device fingerprint missing",
      delta: 8,
      severity: "medium",
      source: "rule",
    });
  } else if (bundle.sharedDeviceAccountCount >= 2) {
    findings.push({
      code: "shared_device",
      label: "Same device seen across multiple accounts",
      delta: Math.min(28, 10 + bundle.sharedDeviceAccountCount * 6),
      severity: "high",
      source: "rule",
      signal: bundle.sharedDeviceAccountCount,
    });
  }

  // Submission completeness
  if (bundle.requiredEvidenceKinds.length > 0) {
    const presentKinds = new Set(
      bundle.evidenceItems
        .filter((i) => !i.replacedAt)
        .map((i) => i.kind),
    );
    const missing = bundle.requiredEvidenceKinds.filter(
      (k) => !presentKinds.has(k),
    );
    if (missing.length > 0) {
      findings.push({
        code: "missing_evidence",
        label: `Missing required evidence: ${missing.join(", ")}`,
        delta: Math.min(24, missing.length * 8),
        severity: missing.length >= 2 ? "high" : "medium",
        source: "rule",
        signal: missing.length,
      });
    }
  }

  if (bundle.evidenceItems.filter((i) => !i.replacedAt).length === 0) {
    findings.push({
      code: "no_evidence",
      label: "No evidence items attached",
      delta: 20,
      severity: "high",
      source: "rule",
    });
  }

  // Duplicate evidence (hash)
  if (duplicateOn) {
    const hashes = bundle.evidenceItems
      .map((i) => i.contentHash)
      .filter((h): h is string => Boolean(h));
    const unique = new Set(hashes);
    if (hashes.length > unique.size) {
      findings.push({
        code: "duplicate_within_submission",
        label: "Duplicate image/document within submission",
        delta: 18,
        severity: "high",
        source: "rule",
      });
    }
    if (bundle.duplicateHashMatches > 0) {
      findings.push({
        code: "duplicate_across_submissions",
        label: "Duplicate evidence detected across submissions",
        delta: Math.min(30, 14 + bundle.duplicateHashMatches * 4),
        severity: "high",
        source: "rule",
        signal: bundle.duplicateHashMatches,
      });
    }
  }

  // Metadata consistency — size/hash presence
  const withoutHash = bundle.evidenceItems.filter(
    (i) => !i.replacedAt && !i.contentHash && i.kind !== "text" && i.kind !== "json",
  );
  if (withoutHash.length > 0) {
    findings.push({
      code: "metadata_incomplete",
      label: "Evidence metadata incomplete (missing content hash)",
      delta: Math.min(10, withoutHash.length * 3),
      severity: "low",
      source: "rule",
    });
  }

  // GPS / geography
  if (geoOn) {
    if (!bundle.gps || bundle.gps.lat == null || bundle.gps.lng == null) {
      findings.push({
        code: "gps_missing",
        label: "GPS snapshot missing",
        delta: 10,
        severity: "medium",
        source: "rule",
      });
    } else {
      if (
        bundle.campaignCountryScope.length > 0 &&
        bundle.workerCountryCode &&
        !bundle.campaignCountryScope.includes(bundle.workerCountryCode)
      ) {
        findings.push({
          code: "gps_country_mismatch",
          label: "Worker country outside campaign scope",
          delta: 16,
          severity: "high",
          source: "rule",
          signal: bundle.workerCountryCode,
        });
      }

      if (bundle.campaignCenter && bundle.campaignRadiusKm != null) {
        const dist = haversineKm(bundle.campaignCenter, {
          lat: bundle.gps.lat,
          lng: bundle.gps.lng,
        });
        if (dist > bundle.campaignRadiusKm) {
          findings.push({
            code: "gps_outside_boundary",
            label: "GPS outside campaign area",
            delta: Math.min(28, 14 + Math.floor(dist - bundle.campaignRadiusKm)),
            severity: "high",
            source: "rule",
            signal: Math.round(dist * 10) / 10,
          });
        }
      }

      // Impossible travel
      if (
        bundle.previousGps?.lat != null &&
        bundle.previousGps.lng != null &&
        bundle.previousSubmittedAt &&
        bundle.timing.submittedAt
      ) {
        const prevT = Date.parse(bundle.previousSubmittedAt);
        const currT = Date.parse(bundle.timing.submittedAt);
        if (Number.isFinite(prevT) && Number.isFinite(currT) && currT > prevT) {
          const hours = (currT - prevT) / 3_600_000;
          const dist = haversineKm(
            { lat: bundle.previousGps.lat, lng: bundle.previousGps.lng },
            { lat: bundle.gps.lat, lng: bundle.gps.lng },
          );
          const speedKmh = hours > 0 ? dist / hours : dist / 0.001;
          if (speedKmh > 800) {
            findings.push({
              code: "impossible_travel",
              label: "Impossible travel speed between submissions",
              delta: 26,
              severity: "high",
              source: "rule",
              signal: Math.round(speedKmh),
            });
          }
        }
      }
    }
  }

  // Timing — unusually fast
  if (
    bundle.timing.timeSpentSeconds != null &&
    bundle.timing.timeSpentSeconds < 45
  ) {
    findings.push({
      code: "submitted_too_fast",
      label: "Submitted unusually fast",
      delta: bundle.timing.timeSpentSeconds < 15 ? 18 : 10,
      severity: bundle.timing.timeSpentSeconds < 15 ? "high" : "medium",
      source: "rule",
      signal: bundle.timing.timeSpentSeconds,
    });
  }

  if (bundle.recentSubmissionBurst >= 4) {
    findings.push({
      code: "submission_burst",
      label: "Multiple similar submissions in a short period",
      delta: Math.min(20, 8 + bundle.recentSubmissionBurst * 2),
      severity: "medium",
      source: "rule",
      signal: bundle.recentSubmissionBurst,
    });
  }

  // Historical behavior
  if (bundle.historicalRejectionRate >= 0.4) {
    findings.push({
      code: "high_rejection_history",
      label: "High historical rejection rate",
      delta: Math.min(22, Math.round(bundle.historicalRejectionRate * 30)),
      severity: bundle.historicalRejectionRate >= 0.6 ? "high" : "medium",
      source: "rule",
      signal: bundle.historicalRejectionRate,
    });
  }

  if (bundle.priorFraudIndicators > 0) {
    findings.push({
      code: "prior_fraud_indicators",
      label: "Prior fraud indicators on record",
      delta: Math.min(24, 10 + bundle.priorFraudIndicators * 5),
      severity: "high",
      source: "rule",
      signal: bundle.priorFraudIndicators,
    });
  }

  const ruleScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(findings.reduce((sum, f) => sum + f.delta, 0)),
    ),
  );

  return { findings, ruleScore };
}

export { haversineKm };
