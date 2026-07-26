import { z } from "zod";

export const workerContextSchema = z.object({
  userId: z.string().min(1),
  countryCode: z.string().min(2).max(8).nullable(),
  languages: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  devices: z.array(z.string()).default([]),
  trustScore: z.number().min(0).max(100).default(50),
  approvalRate: z.number().min(0).max(1).default(1),
  completedTasks: z.number().int().nonnegative().default(0),
  organizationIds: z.array(z.string()).default([]),
  inviteToken: z.string().nullable().optional(),
});

export const browseMarketplaceSchema = z.object({
  query: z.string().max(200).optional(),
  category: z.string().max(80).optional(),
  campaignId: z.string().optional(),
  country: z.string().min(2).max(8).optional(),
  language: z.string().min(2).max(16).optional(),
  sort: z
    .enum(["newest", "oldest", "reward_desc", "reward_asc", "priority"])
    .default("newest"),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  /** When provided, soft-filter ineligible opportunities */
  worker: workerContextSchema.optional(),
  excludeIneligible: z.boolean().default(false),
});

export const reserveOpportunitySchema = z.object({
  instancePublicId: z.string().min(1),
  worker: workerContextSchema,
});

export const confirmClaimSchema = z.object({
  reservationId: z.string().min(1),
  workerUserId: z.string().min(1),
  /** Optional snapshot for immutable Execution Context */
  worker: workerContextSchema.optional(),
});

export const claimOpportunitySchema = z.object({
  instancePublicId: z.string().min(1),
  worker: workerContextSchema,
});

export type BrowseMarketplaceInput = z.infer<typeof browseMarketplaceSchema>;
export type ReserveOpportunityInput = z.infer<typeof reserveOpportunitySchema>;
export type ConfirmClaimInput = z.infer<typeof confirmClaimSchema>;
export type ClaimOpportunityInput = z.infer<typeof claimOpportunitySchema>;
