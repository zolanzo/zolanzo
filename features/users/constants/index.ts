/**
 * User / profile architecture constants.
 */

export const PROFILE_SECTIONS = [
  "public",
  "private",
  "skills",
  "portfolio",
  "reputation",
  "badges",
  "work_history",
  "performance",
] as const;

export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export const USER_ENTITIES = [
  "User",
  "PublicProfile",
  "PrivateProfile",
  "UserReputation",
  "SkillProfile",
  "UserBadge",
] as const;
