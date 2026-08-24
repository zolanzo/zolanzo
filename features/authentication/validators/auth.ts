import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email().max(320),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  displayName: z.string().trim().min(2).max(80),
  rememberMe: z.boolean().optional().default(false),
});

export const signInSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(320),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const updatePublicProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional().nullable(),
  countryCode: z.string().trim().max(2).optional().nullable(),
  handle: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9-]+$/, "Handle must be lowercase alphanumeric"),
});

export const updatePrivateProfileSchema = z.object({
  legalName: z.string().trim().max(120).optional().nullable(),
  marketingOptIn: z.boolean().optional(),
  addressJson: z.unknown().optional(),
});

export const inviteMemberSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email(),
  orgRole: z.enum([
    "admin",
    "finance",
    "campaign_manager",
    "reviewer",
    "team_member",
    "read_only",
  ]),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(16),
});

export const switchOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

export const createBusinessOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
