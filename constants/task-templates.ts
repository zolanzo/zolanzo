/**
 * Task Template registry — HOW work is performed.
 *
 * A template = ordered capabilities + config schema + validation/review defaults.
 * Campaigns reference a template; Tasks are units generated from a campaign;
 * Workers never work on Campaigns — they work on Assignments.
 */

import {
  evidenceKindsForCapabilities,
  type EvidenceKind,
  type WorkCapability,
} from "@/constants/work-capabilities";
import type { ValidationMode } from "@/constants/work-states";

export type TaskTemplateId = string;

export type TaskTemplateStep = {
  /** Stable step key within the template */
  key: string;
  capability: WorkCapability;
  /** Human instruction (i18n key or literal for architecture) */
  instruction: string;
  required: boolean;
  /** Step-level config (URLs, prompts, geofence, etc.) — schema later */
  configSchemaKey?: string;
};

export type TaskTemplateDefinition = {
  id: TaskTemplateId;
  label: string;
  description: string;
  /** Optional link to campaign-type catalog id */
  campaignTypeId?: string;
  steps: readonly TaskTemplateStep[];
  defaultValidationMode: ValidationMode;
  defaultReviewRequired: boolean;
  status: "active" | "beta" | "deprecated";
  featureFlag?: string;
};

function steps(
  items: Array<Omit<TaskTemplateStep, "required"> & { required?: boolean }>,
): TaskTemplateStep[] {
  return items.map((item) => ({
    ...item,
    required: item.required ?? true,
  }));
}

/**
 * Built-in templates. Compose capabilities — do not fork the engine.
 */
export const TASK_TEMPLATE_REGISTRY: readonly TaskTemplateDefinition[] = [
  {
    id: "instagram_follow",
    label: "Instagram Follow",
    description: "Follow a profile and submit proof.",
    campaignTypeId: "instagram",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "open",
        capability: "opens_url",
        instruction: "Open the Instagram profile URL.",
      },
      {
        key: "login",
        capability: "requires_login",
        instruction: "Ensure you are logged into Instagram.",
        required: false,
      },
      {
        key: "follow",
        capability: "follows_profile",
        instruction: "Follow the profile.",
      },
      {
        key: "proof",
        capability: "captures_screenshot",
        instruction: "Capture a screenshot of the follow confirmation.",
      },
    ]),
  },
  {
    id: "google_play_app_test",
    label: "Google Play App Test",
    description: "Download, open, account, screenshot, feedback.",
    campaignTypeId: "app_testing",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "download",
        capability: "downloads_app",
        instruction: "Download the app from Google Play.",
      },
      {
        key: "open",
        capability: "opens_app",
        instruction: "Open the app.",
      },
      {
        key: "account",
        capability: "creates_account",
        instruction: "Create an account if required by the brief.",
        required: false,
      },
      {
        key: "test",
        capability: "runs_test",
        instruction: "Complete the test checklist.",
      },
      {
        key: "screenshot",
        capability: "captures_screenshot",
        instruction: "Capture required screenshots.",
      },
      {
        key: "feedback",
        capability: "submits_text",
        instruction: "Submit written feedback.",
      },
      {
        key: "device",
        capability: "captures_device_info",
        instruction: "Attach device metadata.",
      },
    ]),
  },
  {
    id: "android_bug_hunt",
    label: "Android Bug Hunt",
    description: "Explore app and report bugs with evidence.",
    campaignTypeId: "bug_hunting",
    defaultValidationMode: "manual",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "download",
        capability: "downloads_app",
        instruction: "Install the build under test.",
      },
      {
        key: "test",
        capability: "runs_test",
        instruction: "Explore according to the bug-hunt brief.",
      },
      {
        key: "logs",
        capability: "captures_logs",
        instruction: "Attach logs if available.",
        required: false,
      },
      {
        key: "report",
        capability: "submits_text",
        instruction: "Describe each bug found.",
      },
      {
        key: "evidence",
        capability: "uploads_video",
        instruction: "Upload reproduction video when needed.",
        required: false,
      },
    ]),
  },
  {
    id: "website_signup",
    label: "Website Signup",
    description: "Create an account on a website with proof.",
    campaignTypeId: "website_signups",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "open",
        capability: "opens_url",
        instruction: "Open the signup URL.",
      },
      {
        key: "account",
        capability: "creates_account",
        instruction: "Create an account per instructions.",
      },
      {
        key: "proof",
        capability: "captures_screenshot",
        instruction: "Screenshot confirmation.",
      },
      {
        key: "link",
        capability: "attaches_link",
        instruction: "Attach profile or confirmation link if available.",
        required: false,
      },
    ]),
  },
  {
    id: "image_annotation",
    label: "Image Annotation",
    description: "Label images per ontology.",
    campaignTypeId: "image_labeling",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: false,
    status: "active",
    steps: steps([
      {
        key: "label",
        capability: "labels_image",
        instruction: "Annotate the assigned image(s).",
      },
      {
        key: "confirm",
        capability: "confirms_action",
        instruction: "Confirm annotation complete.",
      },
    ]),
  },
  {
    id: "voice_recording",
    label: "Voice Recording",
    description: "Record spoken prompts for AI training.",
    campaignTypeId: "voice_recording",
    defaultValidationMode: "ai",
    defaultReviewRequired: false,
    status: "active",
    steps: steps([
      {
        key: "record",
        capability: "records_audio",
        instruction: "Record the prompted sentence(s).",
      },
      {
        key: "meta",
        capability: "submits_json",
        instruction: "Attach recording metadata.",
      },
    ]),
  },
  {
    id: "translation",
    label: "Translation",
    description: "Translate text or documents.",
    campaignTypeId: "translation",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "translate",
        capability: "translates_text",
        instruction: "Translate the source content.",
      },
      {
        key: "upload",
        capability: "uploads_file",
        instruction: "Upload translated file if applicable.",
        required: false,
      },
    ]),
  },
  {
    id: "research",
    label: "Research",
    description: "Perform research and submit findings.",
    campaignTypeId: "research",
    defaultValidationMode: "manual",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "research",
        capability: "submits_text",
        instruction: "Document research findings.",
      },
      {
        key: "sources",
        capability: "attaches_link",
        instruction: "Attach source links.",
        required: false,
      },
      {
        key: "files",
        capability: "uploads_file",
        instruction: "Upload supporting files.",
        required: false,
      },
    ]),
  },
  {
    id: "property_verification",
    label: "Property Verification",
    description: "On-site property verification with geo + media.",
    campaignTypeId: "custom_human_task",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "gps",
        capability: "captures_gps",
        instruction: "Capture GPS at the property.",
      },
      {
        key: "verify",
        capability: "verifies_location",
        instruction: "Confirm location within geofence.",
      },
      {
        key: "photos",
        capability: "uploads_photo",
        instruction: "Upload required photos.",
      },
      {
        key: "video",
        capability: "uploads_video",
        instruction: "Upload walkthrough video.",
        required: false,
      },
      {
        key: "notes",
        capability: "submits_text",
        instruction: "Submit verification notes.",
      },
    ]),
  },
  {
    id: "vehicle_verification",
    label: "Vehicle Verification",
    description: "Verify a vehicle with photos, GPS, and notes.",
    campaignTypeId: "custom_human_task",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "gps",
        capability: "captures_gps",
        instruction: "Capture GPS near the vehicle.",
      },
      {
        key: "photos",
        capability: "takes_photo",
        instruction: "Photograph VIN/plate/condition as briefed.",
      },
      {
        key: "notes",
        capability: "submits_text",
        instruction: "Submit condition notes.",
      },
    ]),
  },
  {
    id: "survey",
    label: "Survey",
    description: "Complete a structured survey.",
    campaignTypeId: "survey_completion",
    defaultValidationMode: "automatic",
    defaultReviewRequired: false,
    status: "active",
    steps: steps([
      {
        key: "survey",
        capability: "completes_survey",
        instruction: "Answer all required survey questions.",
      },
    ]),
  },
  {
    id: "mystery_shopping",
    label: "Mystery Shopping",
    description: "Visit location, capture evidence, rate experience.",
    campaignTypeId: "mystery_shopping",
    defaultValidationMode: "manual",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "gps",
        capability: "captures_gps",
        instruction: "Check in at the location.",
      },
      {
        key: "visit",
        capability: "verifies_location",
        instruction: "Confirm geofence.",
      },
      {
        key: "photos",
        capability: "uploads_photo",
        instruction: "Upload visit photos.",
      },
      {
        key: "rating",
        capability: "collects_rating",
        instruction: "Rate the experience.",
      },
      {
        key: "review",
        capability: "submits_text",
        instruction: "Write mystery shop notes.",
      },
    ]),
  },
  {
    id: "lead_calling",
    label: "Lead Calling",
    description: "Call assigned leads and log outcomes.",
    campaignTypeId: "custom_human_task",
    defaultValidationMode: "hybrid",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "call",
        capability: "places_call",
        instruction: "Place the outbound call.",
      },
      {
        key: "outcome",
        capability: "submits_json",
        instruction: "Log call disposition.",
      },
      {
        key: "notes",
        capability: "submits_text",
        instruction: "Add call notes.",
        required: false,
      },
    ]),
  },
  {
    id: "website_testing",
    label: "Website Testing",
    description: "Test a website and submit findings.",
    campaignTypeId: "website_testing",
    defaultValidationMode: "manual",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "open",
        capability: "opens_url",
        instruction: "Open the target website.",
      },
      {
        key: "test",
        capability: "runs_test",
        instruction: "Execute the test script.",
      },
      {
        key: "screen",
        capability: "records_screen",
        instruction: "Record session if required.",
        required: false,
      },
      {
        key: "report",
        capability: "submits_text",
        instruction: "Submit findings.",
      },
    ]),
  },
  {
    id: "custom_human_task",
    label: "Custom Human Task",
    description: "Client-defined multi-step human work.",
    campaignTypeId: "custom_human_task",
    defaultValidationMode: "manual",
    defaultReviewRequired: true,
    status: "active",
    steps: steps([
      {
        key: "custom",
        capability: "custom_step",
        instruction: "Complete the custom brief.",
      },
    ]),
  },
] as const;

export type BuiltInTaskTemplateId =
  (typeof TASK_TEMPLATE_REGISTRY)[number]["id"];

const templateMap = new Map(
  TASK_TEMPLATE_REGISTRY.map((t) => [t.id, t] as const),
);

const dynamicTemplates = new Map<TaskTemplateId, TaskTemplateDefinition>();

export function registerTaskTemplate(definition: TaskTemplateDefinition): void {
  if (templateMap.has(definition.id) || dynamicTemplates.has(definition.id)) {
    throw new Error(`Task template already registered: ${definition.id}`);
  }
  dynamicTemplates.set(definition.id, definition);
}

export function getTaskTemplate(
  id: TaskTemplateId,
): TaskTemplateDefinition | undefined {
  return templateMap.get(id) ?? dynamicTemplates.get(id);
}

export function listTaskTemplates(options?: {
  includeDeprecated?: boolean;
}): TaskTemplateDefinition[] {
  const all = [...TASK_TEMPLATE_REGISTRY, ...dynamicTemplates.values()];
  if (options?.includeDeprecated) return all;
  return all.filter((t) => t.status !== "deprecated");
}

export function templateEvidenceKinds(id: TaskTemplateId): EvidenceKind[] {
  const template = getTaskTemplate(id);
  if (!template) return [];
  return evidenceKindsForCapabilities(
    template.steps.map((step) => step.capability),
  );
}
