import { z } from "zod";
import {
  AVAILABILITY_WINDOWS,
  NIGERIA_STATES,
  PREFERENCE_CATEGORIES,
  PREFERENCE_PLATFORMS,
} from "@/features/settings/constants";

const platformKeys = PREFERENCE_PLATFORMS.map((p) => p.key) as [string, ...string[]];
const categoryKeys = PREFERENCE_CATEGORIES.map((c) => c.key) as [string, ...string[]];
const availabilityKeys = AVAILABILITY_WINDOWS as unknown as [string, ...string[]];
const stateKeys = NIGERIA_STATES as unknown as [string, ...string[]];

export const opportunityPreferencesSchema = z.object({
  preferredState: z.enum(stateKeys).nullable().optional(),
  preferredCity: z.string().trim().max(80).nullable().optional(),
  remotePreferred: z.boolean().optional(),
  minRewardMinor: z.number().int().min(0).max(5_000_000_00).optional(),
  preferredPlatforms: z.array(z.enum(platformKeys)).max(20).optional(),
  preferredCategories: z.array(z.enum(categoryKeys)).max(20).optional(),
  availability: z.array(z.enum(availabilityKeys)).max(10).optional(),
  matchingNotifications: z.boolean().optional(),
});

export const accountProfileFormSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  handle: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/, "Handle must be lowercase alphanumeric"),
  legalName: z.string().trim().max(120).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
  preferredState: z.enum(stateKeys).nullable().optional(),
  preferredCity: z.string().trim().max(80).nullable().optional(),
});

export type OpportunityPreferencesInput = z.infer<typeof opportunityPreferencesSchema>;
export type AccountProfileFormInput = z.infer<typeof accountProfileFormSchema>;
