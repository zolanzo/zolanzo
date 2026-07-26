/**
 * Seed blueprint definitions for Task Templates.
 * Mapped into DB rows by prisma/seed/task-templates.ts
 */

import type { CreateTaskTemplateInput } from "@/features/task-templates/validators";
import { defaultEvidenceFromSteps } from "@/features/task-templates/services/capability-composition";
import type { TemplateStepDefinition } from "@/features/task-templates/types";

function steps(
  items: Array<Omit<TemplateStepDefinition, "required"> & { required?: boolean }>,
): TemplateStepDefinition[] {
  return items.map((item) => ({ ...item, required: item.required ?? true }));
}

function base(input: {
  templateKey: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  difficulty?: CreateTaskTemplateInput["difficulty"];
  capabilitySet: TemplateStepDefinition[];
  validationMode: CreateTaskTemplateInput["validationRules"]["mode"];
  reviewRequired: boolean;
  amountMinor: number;
  constraints?: CreateTaskTemplateInput["constraints"];
  platforms?: string[];
  devices?: string[];
  countries?: string[];
  languages?: string[];
  skills?: string[];
}): CreateTaskTemplateInput {
  return {
    templateKey: input.templateKey,
    name: input.name,
    slug: input.slug,
    description: input.description,
    category: input.category,
    difficulty: input.difficulty ?? "medium",
    estimatedDurationMin: 30,
    capabilitySet: input.capabilitySet,
    requiredEvidence: defaultEvidenceFromSteps(input.capabilitySet),
    submissionSchema: {
      type: "object",
      properties: {
        notes: { type: "string" },
      },
    },
    validationRules: {
      mode: input.validationMode,
      ruleKeys:
        input.validationMode === "rule_based" ? ["schema.required_fields"] : [],
      aiAssist: input.validationMode === "ai" || input.validationMode === "hybrid",
    },
    reviewRules: {
      required: input.reviewRequired,
      actions: input.reviewRequired
        ? ["approval", "rejection", "revision_request", "escalation"]
        : ["approval", "sampling"],
      samplingRate: input.reviewRequired ? undefined : 0.1,
    },
    rewardStrategy: {
      kind: "fixed",
      amountMinor: input.amountMinor,
      currency: "NGN",
    },
    constraints: input.constraints ?? [],
    supportedPlatforms: input.platforms ?? ["web", "android", "ios"],
    supportedDevices: input.devices ?? [],
    supportedCountries: input.countries ?? [],
    supportedLanguages: input.languages ?? ["en"],
    requiredSkills: input.skills ?? [],
    visibility: "platform",
    metadata: { seeded: true },
  };
}

export const SEED_TASK_TEMPLATES: CreateTaskTemplateInput[] = [
  base({
    templateKey: "google_play_app_test",
    name: "Google Play App Test",
    slug: "google-play-app-test",
    description: "Download, open, test, and feedback on a Play Store app.",
    category: "app_testing",
    validationMode: "hybrid",
    reviewRequired: true,
    amountMinor: 150000,
    platforms: ["android"],
    devices: ["android"],
    constraints: [
      {
        id: "android_only",
        kind: "device",
        op: "platform_in",
        params: { platforms: ["android"] },
        enforcement: "hard",
        label: "Android devices only",
      },
    ],
    capabilitySet: steps([
      { key: "download", capability: "downloads_app", instruction: "Download from Google Play." },
      { key: "open", capability: "opens_app", instruction: "Open the app." },
      { key: "account", capability: "creates_account", instruction: "Create account if required.", required: false },
      { key: "test", capability: "runs_test", instruction: "Complete the test checklist." },
      { key: "photo", capability: "captures_photo", instruction: "Capture required screenshots/photos." },
      { key: "feedback", capability: "submits_text", instruction: "Submit written feedback." },
    ]),
  }),
  base({
    templateKey: "website_signup",
    name: "Website Signup",
    slug: "website-signup",
    description: "Create an account on a website with proof.",
    category: "growth",
    validationMode: "hybrid",
    reviewRequired: true,
    amountMinor: 80000,
    capabilitySet: steps([
      { key: "open", capability: "opens_url", instruction: "Open the signup URL." },
      { key: "account", capability: "creates_account", instruction: "Create an account." },
      { key: "proof", capability: "captures_screenshot", instruction: "Screenshot confirmation." },
    ]),
  }),
  base({
    templateKey: "image_labeling",
    name: "Image Labeling",
    slug: "image-labeling",
    description: "Annotate images per ontology.",
    category: "ai_data",
    validationMode: "hybrid",
    reviewRequired: false,
    amountMinor: 50000,
    difficulty: "easy",
    capabilitySet: steps([
      { key: "label", capability: "labels_image", instruction: "Label the assigned image(s)." },
      { key: "confirm", capability: "confirms_action", instruction: "Confirm annotation complete." },
    ]),
  }),
  base({
    templateKey: "property_verification",
    name: "Property Verification",
    slug: "property-verification",
    description: "On-site property verification with geo + media.",
    category: "field",
    validationMode: "hybrid",
    reviewRequired: true,
    amountMinor: 500000,
    difficulty: "hard",
    constraints: [
      {
        id: "geofence",
        kind: "location",
        op: "geofence_radius_m",
        params: { radiusM: 2000 },
        enforcement: "hard",
      },
      {
        id: "trust",
        kind: "worker",
        op: "min_trust_score",
        params: { min: 60 },
        enforcement: "hard",
      },
    ],
    capabilitySet: steps([
      { key: "gps", capability: "captures_gps", instruction: "Capture GPS at the property." },
      { key: "verify", capability: "verifies_location", instruction: "Confirm geofence." },
      { key: "photos", capability: "captures_photo", instruction: "Upload required photos." },
      { key: "video", capability: "captures_video", instruction: "Upload walkthrough video.", required: false },
      { key: "notes", capability: "submits_text", instruction: "Submit verification notes." },
    ]),
  }),
  base({
    templateKey: "survey_completion",
    name: "Survey Completion",
    slug: "survey-completion",
    description: "Complete a structured survey.",
    category: "research",
    validationMode: "automatic",
    reviewRequired: false,
    amountMinor: 30000,
    difficulty: "easy",
    capabilitySet: steps([
      { key: "survey", capability: "completes_survey", instruction: "Answer all required questions." },
      { key: "extra", capability: "answers_questions", instruction: "Answer follow-up questions.", required: false },
    ]),
  }),
  base({
    templateKey: "voice_collection",
    name: "Voice Collection",
    slug: "voice-collection",
    description: "Record spoken prompts for AI training.",
    category: "ai_data",
    validationMode: "ai",
    reviewRequired: false,
    amountMinor: 70000,
    capabilitySet: steps([
      { key: "record", capability: "captures_audio", instruction: "Record the prompted sentences." },
      { key: "meta", capability: "submits_json", instruction: "Attach recording metadata." },
    ]),
  }),
  base({
    templateKey: "bug_report",
    name: "Bug Report",
    slug: "bug-report",
    description: "Explore an app and report bugs with evidence.",
    category: "qa",
    validationMode: "manual",
    reviewRequired: true,
    amountMinor: 200000,
    difficulty: "hard",
    platforms: ["android", "ios", "web"],
    capabilitySet: steps([
      { key: "test", capability: "runs_test", instruction: "Explore according to the brief." },
      { key: "screen", capability: "records_screen", instruction: "Record reproduction when needed.", required: false },
      { key: "report", capability: "submits_text", instruction: "Describe each bug." },
      { key: "logs", capability: "captures_logs", instruction: "Attach logs if available.", required: false },
    ]),
  }),
  base({
    templateKey: "research_task",
    name: "Research Task",
    slug: "research-task",
    description: "Perform research and submit findings.",
    category: "research",
    validationMode: "manual",
    reviewRequired: true,
    amountMinor: 250000,
    capabilitySet: steps([
      { key: "research", capability: "submits_text", instruction: "Document research findings." },
      { key: "sources", capability: "attaches_link", instruction: "Attach source links.", required: false },
      { key: "files", capability: "uploads_file", instruction: "Upload supporting files.", required: false },
    ]),
  }),
  base({
    templateKey: "translation_task",
    name: "Translation Task",
    slug: "translation-task",
    description: "Translate text or documents.",
    category: "language",
    validationMode: "hybrid",
    reviewRequired: true,
    amountMinor: 120000,
    languages: ["en", "fr", "es", "ha", "yo", "ig"],
    skills: ["translation"],
    constraints: [
      {
        id: "lang",
        kind: "worker",
        op: "language_in",
        params: { languages: ["en"] },
        enforcement: "soft",
      },
    ],
    capabilitySet: steps([
      { key: "translate", capability: "translates_text", instruction: "Translate the source content." },
      { key: "upload", capability: "uploads_file", instruction: "Upload translated file if applicable.", required: false },
    ]),
  }),
  base({
    templateKey: "custom_human_task",
    name: "Custom Human Task",
    slug: "custom-human-task",
    description: "Client-defined multi-step human work.",
    category: "custom",
    validationMode: "manual",
    reviewRequired: true,
    amountMinor: 100000,
    capabilitySet: steps([
      {
        key: "custom",
        capability: "custom_capability",
        instruction: "Complete the custom brief.",
      },
    ]),
  }),
];
