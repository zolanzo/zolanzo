/**
 * Extensible campaign type registry (catalog / category layer).
 *
 * HOW work is performed lives in Task Templates + Work Capabilities:
 * - `constants/work-capabilities.ts` — atomic steps
 * - `constants/task-templates.ts` — composed workflows
 *
 * CampaignCapability below = platform requirements (KYC, escrow, geo…),
 * not compositional work steps.
 */

export const CAMPAIGN_CATEGORIES = [
  "app_distribution",
  "testing_qa",
  "reviews_ratings",
  "signups_surveys",
  "ai_data",
  "media_collection",
  "language",
  "research",
  "community_growth",
  "social_platforms",
  "custom_human",
] as const;

export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

/**
 * Capability flags describe what the type needs from the platform.
 * New capabilities can be added without breaking existing types.
 */
export type CampaignCapability =
  | "requires_device"
  | "requires_location"
  | "requires_kyc"
  | "requires_microphone"
  | "requires_camera"
  | "requires_file_upload"
  | "requires_url_proof"
  | "requires_video_proof"
  | "supports_batch"
  | "supports_realtime_review"
  | "supports_ai_assist_review"
  | "geo_restricted"
  | "age_gated"
  | "pays_per_unit"
  | "pays_per_hour"
  | "escrow_required";

export type CampaignTypeId = string;

export type CampaignTypeDefinition = {
  /** Stable machine id — never rename once shipped */
  id: CampaignTypeId;
  /** Human label */
  label: string;
  category: CampaignCategory;
  description: string;
  capabilities: readonly CampaignCapability[];
  /**
   * Validator module key under features/campaigns/validators
   * or a dedicated feature (e.g. features/ai-labeling/validators)
   */
  validatorKey: string;
  /** Default verification strategy key */
  verificationStrategy: string;
  /** Whether type is generally available or behind a flag */
  featureFlag?: string;
  /** Soft-deprecated types remain in registry for historical campaigns */
  status: "active" | "beta" | "deprecated";
};

/**
 * Built-in catalog. Extend by appending — never fork the campaign domain.
 */
export const CAMPAIGN_TYPE_REGISTRY: readonly CampaignTypeDefinition[] = [
  // App / testing
  {
    id: "app_downloads",
    label: "App Downloads",
    category: "app_distribution",
    description: "Drive installs with proof of download.",
    capabilities: ["requires_device", "requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.app_downloads",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "app_testing",
    label: "App Testing",
    category: "testing_qa",
    description: "Structured app test sessions on target devices.",
    capabilities: [
      "requires_device",
      "requires_file_upload",
      "supports_batch",
      "pays_per_unit",
      "escrow_required",
    ],
    validatorKey: "testing.app_testing",
    verificationStrategy: "manual_or_rubric",
    status: "active",
  },
  {
    id: "website_testing",
    label: "Website Testing",
    category: "testing_qa",
    description: "Usability and functional testing of web properties.",
    capabilities: ["requires_url_proof", "requires_file_upload", "pays_per_unit", "escrow_required"],
    validatorKey: "testing.website_testing",
    verificationStrategy: "manual_or_rubric",
    status: "active",
  },
  {
    id: "qa_testing",
    label: "QA Testing",
    category: "testing_qa",
    description: "Formal QA scripts and checklists.",
    capabilities: ["requires_file_upload", "supports_batch", "pays_per_hour", "escrow_required"],
    validatorKey: "qa.default",
    verificationStrategy: "rubric",
    status: "active",
  },
  {
    id: "bug_hunting",
    label: "Bug Hunting",
    category: "testing_qa",
    description: "Bounty-style bug discovery and reports.",
    capabilities: ["requires_file_upload", "pays_per_unit", "escrow_required"],
    validatorKey: "bug-reports.default",
    verificationStrategy: "moderation",
    status: "active",
  },
  // Reviews
  {
    id: "google_play_reviews",
    label: "Google Play Reviews",
    category: "reviews_ratings",
    description: "Authenticated Play Store review tasks.",
    capabilities: ["requires_device", "requires_url_proof", "requires_kyc", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.play_reviews",
    verificationStrategy: "proof_url",
    featureFlag: "campaign.google_play_reviews",
    status: "active",
  },
  {
    id: "app_store_reviews",
    label: "App Store Reviews",
    category: "reviews_ratings",
    description: "Authenticated App Store review tasks.",
    capabilities: ["requires_device", "requires_url_proof", "requires_kyc", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.app_store_reviews",
    verificationStrategy: "proof_url",
    featureFlag: "campaign.app_store_reviews",
    status: "active",
  },
  {
    id: "product_reviews",
    label: "Product Reviews",
    category: "reviews_ratings",
    description: "Written or multimedia product reviews.",
    capabilities: ["requires_file_upload", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.product_reviews",
    verificationStrategy: "manual_or_ai",
    status: "active",
  },
  // Signups / surveys / mystery
  {
    id: "website_signups",
    label: "Website Signups",
    category: "signups_surveys",
    description: "Account creation and onboarding proofs.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.website_signups",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "survey_completion",
    label: "Survey Completion",
    category: "signups_surveys",
    description: "Structured survey responses.",
    capabilities: ["supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.survey_completion",
    verificationStrategy: "auto_schema",
    status: "active",
  },
  {
    id: "mystery_shopping",
    label: "Mystery Shopping",
    category: "research",
    description: "On-site or remote mystery shop experiences.",
    capabilities: [
      "requires_location",
      "requires_camera",
      "requires_file_upload",
      "geo_restricted",
      "pays_per_unit",
      "escrow_required",
    ],
    validatorKey: "research.mystery_shopping",
    verificationStrategy: "manual",
    status: "active",
  },
  // AI / media
  {
    id: "voice_recording",
    label: "Voice Recording",
    category: "ai_data",
    description: "Record spoken prompts for AI training.",
    capabilities: ["requires_microphone", "requires_file_upload", "supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "voice-collection.recording",
    verificationStrategy: "audio_qa",
    status: "active",
  },
  {
    id: "voice_validation",
    label: "Voice Validation",
    category: "ai_data",
    description: "Validate quality of collected voice samples.",
    capabilities: ["requires_microphone", "supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "voice-collection.validation",
    verificationStrategy: "audio_qa",
    status: "active",
  },
  {
    id: "image_collection",
    label: "Image Collection",
    category: "media_collection",
    description: "Capture or upload images to a brief.",
    capabilities: ["requires_camera", "requires_file_upload", "supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "image-annotation.collection",
    verificationStrategy: "visual_qa",
    status: "active",
  },
  {
    id: "image_labeling",
    label: "Image Labeling",
    category: "ai_data",
    description: "Annotate images with labels, boxes, or polygons.",
    capabilities: ["supports_batch", "supports_ai_assist_review", "pays_per_unit", "escrow_required"],
    validatorKey: "ai-labeling.image",
    verificationStrategy: "consensus_or_expert",
    status: "active",
  },
  {
    id: "video_labeling",
    label: "Video Labeling",
    category: "ai_data",
    description: "Annotate video frames or segments.",
    capabilities: ["supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "video-annotation.default",
    verificationStrategy: "consensus_or_expert",
    status: "active",
  },
  {
    id: "translation",
    label: "Translation",
    category: "language",
    description: "Human translation of text or documents.",
    capabilities: ["requires_file_upload", "supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "translation.default",
    verificationStrategy: "linguistic_qa",
    status: "active",
  },
  {
    id: "audio_transcription",
    label: "Audio Transcription",
    category: "language",
    description: "Transcribe audio to text.",
    capabilities: ["supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "translation.transcription",
    verificationStrategy: "linguistic_qa",
    status: "active",
  },
  {
    id: "data_entry",
    label: "Data Entry",
    category: "research",
    description: "Structured data capture from sources.",
    capabilities: ["supports_batch", "pays_per_unit", "escrow_required"],
    validatorKey: "research.data_entry",
    verificationStrategy: "schema_validation",
    status: "active",
  },
  {
    id: "research",
    label: "Research",
    category: "research",
    description: "Open-ended or structured research tasks.",
    capabilities: ["requires_file_upload", "pays_per_unit", "pays_per_hour", "escrow_required"],
    validatorKey: "research.default",
    verificationStrategy: "manual",
    status: "active",
  },
  // Community / social
  {
    id: "community_growth",
    label: "Community Growth",
    category: "community_growth",
    description: "Grow owned communities with verified actions.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.community_growth",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "telegram",
    label: "Telegram",
    category: "social_platforms",
    description: "Telegram join, engage, or moderate tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.telegram",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "discord",
    label: "Discord",
    category: "social_platforms",
    description: "Discord community tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.discord",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    category: "social_platforms",
    description: "WhatsApp community or broadcast tasks.",
    capabilities: ["requires_url_proof", "geo_restricted", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.whatsapp",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    category: "social_platforms",
    description: "LinkedIn engagement and growth tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.linkedin",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "youtube",
    label: "YouTube",
    category: "social_platforms",
    description: "YouTube watch, comment, or create tasks.",
    capabilities: ["requires_url_proof", "requires_video_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.youtube",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "instagram",
    label: "Instagram",
    category: "social_platforms",
    description: "Instagram engagement tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.instagram",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "facebook",
    label: "Facebook",
    category: "social_platforms",
    description: "Facebook page and group tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.facebook",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "threads",
    label: "Threads",
    category: "social_platforms",
    description: "Threads engagement tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.threads",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "reddit",
    label: "Reddit",
    category: "social_platforms",
    description: "Reddit campaign tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.reddit",
    verificationStrategy: "proof_url",
    featureFlag: "campaign.reddit",
    status: "active",
  },
  {
    id: "x_twitter",
    label: "X",
    category: "social_platforms",
    description: "X (Twitter) engagement tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.x",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "github",
    label: "GitHub",
    category: "social_platforms",
    description: "Star, contribute, or review GitHub repos.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.github",
    verificationStrategy: "proof_url",
    status: "active",
  },
  {
    id: "product_hunt",
    label: "Product Hunt",
    category: "social_platforms",
    description: "Product Hunt launch support tasks.",
    capabilities: ["requires_url_proof", "pays_per_unit", "escrow_required"],
    validatorKey: "campaigns.product_hunt",
    verificationStrategy: "proof_url",
    status: "active",
  },
  // Escape hatch — future types need ZERO structural changes
  {
    id: "custom_human_task",
    label: "Custom Human Task",
    category: "custom_human",
    description:
      "Advertiser-defined human work with custom brief, proof, and rubric.",
    capabilities: [
      "requires_file_upload",
      "requires_url_proof",
      "requires_video_proof",
      "supports_batch",
      "pays_per_unit",
      "pays_per_hour",
      "escrow_required",
    ],
    validatorKey: "campaigns.custom_human",
    verificationStrategy: "custom_rubric",
    status: "active",
  },
] as const;

export type BuiltInCampaignTypeId =
  (typeof CAMPAIGN_TYPE_REGISTRY)[number]["id"];

const registryMap = new Map(
  CAMPAIGN_TYPE_REGISTRY.map((def) => [def.id, def] as const),
);

/** Runtime + plugin registrations land here without schema migrations of the registry shape */
const dynamicRegistry = new Map<CampaignTypeId, CampaignTypeDefinition>();

export function registerCampaignType(definition: CampaignTypeDefinition): void {
  if (registryMap.has(definition.id) || dynamicRegistry.has(definition.id)) {
    throw new Error(`Campaign type already registered: ${definition.id}`);
  }
  dynamicRegistry.set(definition.id, definition);
}

export function getCampaignType(
  id: CampaignTypeId,
): CampaignTypeDefinition | undefined {
  return registryMap.get(id) ?? dynamicRegistry.get(id);
}

export function listCampaignTypes(options?: {
  includeDeprecated?: boolean;
}): CampaignTypeDefinition[] {
  const all = [
    ...CAMPAIGN_TYPE_REGISTRY,
    ...dynamicRegistry.values(),
  ];
  if (options?.includeDeprecated) return all;
  return all.filter((t) => t.status !== "deprecated");
}

export function campaignTypeHasCapability(
  id: CampaignTypeId,
  capability: CampaignCapability,
): boolean {
  const def = getCampaignType(id);
  return Boolean(def?.capabilities.includes(capability));
}
