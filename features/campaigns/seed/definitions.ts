/**
 * Seed campaign definitions — consume seeded Task Templates.
 */

import type { CreateCampaignInput } from "@/features/campaigns/validators";

type SeedCampaignDef = Omit<
  CreateCampaignInput,
  | "organizationId"
  | "clientUserId"
  | "taskTemplateId"
  | "claimPolicies"
  | "reservationTimeoutSeconds"
> & {
  /** Matches seeded TaskTemplate.templateKey */
  templateKey: string;
  /** Seed status after create (defaults draft; seed may publish) */
  seedStatus?: "draft" | "scheduled" | "active";
  claimPolicies?: CreateCampaignInput["claimPolicies"];
  reservationTimeoutSeconds?: number;
};

function brief(partial: {
  objective: string;
  metrics: string[];
  instructions: string;
  quality: string;
  good?: string[];
  bad?: string[];
  reviewer: string;
}): CreateCampaignInput["brief"] {
  return {
    businessObjective: partial.objective,
    successMetrics: partial.metrics,
    workerInstructions: partial.instructions,
    qualityExpectations: partial.quality,
    acceptableExamples: partial.good ?? ["Clear evidence matching instructions"],
    unacceptableExamples: partial.bad ?? ["Blurry or incomplete evidence"],
    reviewerGuidance: partial.reviewer,
  };
}

export const SEED_CAMPAIGNS: SeedCampaignDef[] = [
  {
    templateKey: "google_play_app_test",
    name: "Lagos Fintech App QA Wave",
    slug: "lagos-fintech-app-qa",
    description: "Business contract for Android QA coverage on a fintech app.",
    objective: "Validate onboarding and core flows before Play Store push.",
    category: "app_testing",
    tags: ["fintech", "android", "qa"],
    brief: brief({
      objective: "Ship a stable Android release with verified onboarding.",
      metrics: ["≥90% approval rate", "50 approved units"],
      instructions:
        "Follow the Google Play App Test template. Focus on signup, KYC screen, and first transfer.",
      quality: "Screenshots must show account email and success states.",
      good: ["Clear screenshot of verified home balance"],
      bad: ["Screenshot of unrelated apps"],
      reviewer: "Reject if device is not Android or flows incomplete.",
    }),
    generationStrategy: "pre_generated",
    generationPolicy: "fixed_quantity",
    generationPolicyConfig: { policy: "fixed_quantity", quantity: 50 },
    targetQuantity: 50,
    budgetKind: "quantity_times_reward",
    currency: "NGN",
    rewardPerUnitMinor: 150000,
    countryScope: ["NG"],
    languageScope: ["en"],
    deviceScope: ["android"],
    audienceConstraints: [
      {
        id: "android_only",
        kind: "device",
        op: "platform_in",
        params: { platforms: ["android"] },
        enforcement: "hard",
        label: "Android only (campaign override same id)",
      },
    ],
    claimPolicies: [
      { kind: "first_come_first_served" },
      { kind: "one_active_per_campaign" },
      { kind: "max_concurrent_assignments", max: 5 },
    ],
    reservationTimeoutSeconds: 120,
    scheduleMode: "immediate",
    timezone: "Africa/Lagos",
    visibility: "organization",
    priority: "high",
    seedStatus: "active",
    metadata: { seeded: true },
  },
  {
    templateKey: "image_labeling",
    name: "Retail Shelf Labeling Batch",
    slug: "retail-shelf-labeling",
    description: "Label retail shelf images for catalog ML.",
    objective: "Produce 1,000 approved shelf annotations.",
    category: "ai_data",
    tags: ["ml", "labeling"],
    brief: brief({
      objective: "Train shelf detection model for retail partners.",
      metrics: ["1,000 approved labels", "<5% reject rate"],
      instructions: "Label products per ontology; mark occlusions.",
      quality: "Bounding boxes must tightly fit visible products.",
      reviewer: "Sample 10% for ontology accuracy.",
    }),
    generationStrategy: "batch",
    generationConfig: { batchSize: 100, intervalMinutes: 60 },
    generationPolicy: "scheduled_batch",
    generationPolicyConfig: {
      policy: "scheduled_batch",
      batchSize: 100,
      intervalMinutes: 60,
    },
    targetQuantity: 1000,
    budgetKind: "fixed",
    budgetMinor: 55_000_000,
    currency: "NGN",
    rewardPerUnitMinor: 50000,
    countryScope: [],
    languageScope: ["en"],
    deviceScope: [],
    audienceConstraints: [],
    scheduleMode: "scheduled",
    timezone: "UTC",
    startAt: "2026-08-01T09:00:00.000Z",
    endAt: "2026-09-01T09:00:00.000Z",
    visibility: "organization",
    priority: "normal",
    seedStatus: "scheduled",
    metadata: { seeded: true },
  },
  {
    templateKey: "property_verification",
    name: "Abuja Property Spot Checks",
    slug: "abuja-property-spot-checks",
    description: "On-site verification for listed properties in Abuja.",
    objective: "Verify 25 listings with geo + photo evidence.",
    category: "field",
    tags: ["real-estate", "field"],
    brief: brief({
      objective: "Reduce fake listings before escrow funding.",
      metrics: ["25 approved verifications"],
      instructions: "Arrive on site, capture GPS and facade photos.",
      quality: "GPS within geofence; daylight photos preferred.",
      reviewer: "Escalate if address mismatch > 200m.",
    }),
    generationStrategy: "on_demand",
    generationPolicy: "demand_buffer",
    generationPolicyConfig: {
      policy: "demand_buffer",
      maintainAvailable: 10,
      refillBelow: 3,
    },
    targetQuantity: 25,
    budgetKind: "quantity_times_reward",
    currency: "NGN",
    rewardPerUnitMinor: 500000,
    countryScope: ["NG"],
    languageScope: ["en"],
    deviceScope: ["android", "ios"],
    audienceConstraints: [
      {
        id: "trust",
        kind: "worker",
        op: "min_trust_score",
        params: { min: 70 },
        enforcement: "hard",
        label: "Campaign raises trust floor to 70",
      },
    ],
    scheduleMode: "immediate",
    timezone: "Africa/Lagos",
    visibility: "organization",
    priority: "urgent",
    seedStatus: "draft",
    metadata: { seeded: true },
  },
  {
    templateKey: "survey_completion",
    name: "Nigeria Consumer Pulse Survey",
    slug: "ng-consumer-pulse",
    description: "Short consumer sentiment survey across Nigeria.",
    objective: "Collect 500 completed surveys.",
    category: "research",
    tags: ["survey", "research"],
    brief: brief({
      objective: "Measure brand awareness for Q3 planning.",
      metrics: ["500 completed surveys"],
      instructions: "Answer all required questions honestly.",
      quality: "Complete all required fields; no spam answers.",
      reviewer: "Auto-approve when validation passes.",
    }),
    generationStrategy: "api_driven",
    generationConfig: { allowExternalCreate: true },
    generationPolicy: "api_controlled",
    generationPolicyConfig: { policy: "api_controlled", maxPerRequest: 50 },
    targetQuantity: 500,
    budgetKind: "quantity_times_reward",
    currency: "NGN",
    rewardPerUnitMinor: 30000,
    countryScope: ["NG"],
    languageScope: ["en"],
    deviceScope: [],
    audienceConstraints: [],
    scheduleMode: "immediate",
    timezone: "Africa/Lagos",
    visibility: "platform",
    priority: "normal",
    seedStatus: "draft",
    metadata: { seeded: true },
  },
  {
    templateKey: "website_signup",
    name: "Partner Portal Signup Drive",
    slug: "partner-portal-signup",
    description: "Drive verified signups on partner portal.",
    objective: "200 verified account creations.",
    category: "growth",
    tags: ["growth", "signup"],
    brief: brief({
      objective: "Grow partner funnel with proof of signup.",
      metrics: ["200 approved signups"],
      instructions: "Create account and screenshot confirmation email/page.",
      quality: "Email address must be visible in proof.",
      reviewer: "Reject disposable email domains.",
    }),
    generationStrategy: "streaming",
    generationConfig: { sourceKey: "partner_signup_feed" },
    generationPolicy: "rolling_window",
    generationPolicyConfig: { policy: "rolling_window", windowSize: 40 },
    targetQuantity: 200,
    budgetKind: "fixed",
    budgetMinor: 20_000_000,
    currency: "NGN",
    rewardPerUnitMinor: 80000,
    countryScope: ["NG", "GH", "KE"],
    languageScope: ["en"],
    deviceScope: [],
    audienceConstraints: [],
    scheduleMode: "immediate",
    timezone: "UTC",
    visibility: "organization",
    priority: "normal",
    seedStatus: "draft",
    metadata: { seeded: true },
  },
];
