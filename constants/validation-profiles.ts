/**
 * Validation profile catalog — selects which validators run.
 */

import type {
  ValidationProfileKey,
  ValidatorName,
} from "@/constants/work-states";

export type ValidationProfileDefinition = {
  key: ValidationProfileKey;
  name: string;
  description: string;
  enabledValidators: readonly ValidatorName[];
  /** Optional rule keys evaluated by the Rule Validator */
  ruleKeys?: readonly string[];
  config?: {
    minEvidenceCount?: number;
    minTimeSpentSeconds?: number;
    requireGps?: boolean;
    requireDeviceSnapshot?: boolean;
  };
};

const ALL_CORE: readonly ValidatorName[] = [
  "manifest",
  "evidence",
  "step_completion",
  "timing",
  "rule",
  "execution_context",
  "file_reference",
  "gps",
  "device",
];

export const VALIDATION_PROFILES: Record<
  ValidationProfileKey,
  ValidationProfileDefinition
> = {
  app_testing: {
    key: "app_testing",
    name: "App Testing",
    description: "Screenshots, recordings, and step completion for app QA.",
    enabledValidators: ALL_CORE,
    ruleKeys: ["require_image", "min_evidence_count"],
    config: { minEvidenceCount: 1, minTimeSpentSeconds: 30 },
  },
  survey: {
    key: "survey",
    name: "Survey",
    description: "Text-heavy survey responses with light evidence checks.",
    enabledValidators: [
      "manifest",
      "evidence",
      "step_completion",
      "timing",
      "rule",
      "execution_context",
    ],
    ruleKeys: ["require_text", "min_evidence_count"],
    config: { minEvidenceCount: 1, minTimeSpentSeconds: 10 },
  },
  ai_labeling: {
    key: "ai_labeling",
    name: "AI Labeling",
    description: "JSON/label payloads for dataset annotation tasks.",
    enabledValidators: [
      "manifest",
      "evidence",
      "step_completion",
      "timing",
      "rule",
      "execution_context",
      "file_reference",
    ],
    ruleKeys: ["require_json", "min_evidence_count"],
    config: { minEvidenceCount: 1, minTimeSpentSeconds: 5 },
  },
  property_verification: {
    key: "property_verification",
    name: "Property Verification",
    description: "GPS + image evidence for on-site verification.",
    enabledValidators: ALL_CORE,
    ruleKeys: ["require_image", "require_gps", "min_evidence_count"],
    config: {
      minEvidenceCount: 2,
      minTimeSpentSeconds: 60,
      requireGps: true,
      requireDeviceSnapshot: true,
    },
  },
  voice_recording: {
    key: "voice_recording",
    name: "Voice Recording",
    description: "Audio evidence and timing for voice collection.",
    enabledValidators: [
      "manifest",
      "evidence",
      "step_completion",
      "timing",
      "rule",
      "execution_context",
      "file_reference",
      "device",
    ],
    ruleKeys: ["require_audio", "min_evidence_count"],
    config: { minEvidenceCount: 1, minTimeSpentSeconds: 15 },
  },
  translation: {
    key: "translation",
    name: "Translation",
    description: "Text/JSON translation deliverables.",
    enabledValidators: [
      "manifest",
      "evidence",
      "step_completion",
      "timing",
      "rule",
      "execution_context",
    ],
    ruleKeys: ["require_text", "min_evidence_count"],
    config: { minEvidenceCount: 1, minTimeSpentSeconds: 20 },
  },
};

export function getValidationProfile(
  key: ValidationProfileKey,
): ValidationProfileDefinition {
  return VALIDATION_PROFILES[key];
}

export function listValidationProfiles(): ValidationProfileDefinition[] {
  return Object.values(VALIDATION_PROFILES);
}
