/**
 * Platform RBAC roles for ZOLANZO.
 * Organization-scoped roles live in constants/org-roles.ts.
 * Authorization data MUST live in app_metadata / server tables — never user_metadata.
 *
 * Demand-side role: **client** (posts work).
 * `advertiser` is a deprecated alias that maps to `client`.
 */

import type { UserType } from "@/types/domain";

export const ROLES = [
  "guest",
  "worker",
  "client",
  /** @deprecated Use `client` */
  "advertiser",
  "org_member",
  "org_admin",
  "moderator",
  "support",
  "reviewer",
  "operations",
  "finance",
  "auditor",
  "admin",
  "super_admin",
  "developer",
  "api_client",
] as const;

export type Role = (typeof ROLES)[number];

export function normalizeRole(role: Role): Exclude<Role, "advertiser"> {
  return role === "advertiser" ? "client" : role;
}

/** Map coarse user types → default platform roles */
export const USER_TYPE_DEFAULT_ROLES: Record<UserType, readonly Role[]> = {
  guest: ["guest"],
  worker: ["worker"],
  client: ["client"],
  advertiser: ["client"],
  organization: ["org_member"],
  moderator: ["moderator"],
  support: ["support"],
  admin: ["admin"],
  super_admin: ["super_admin"],
  developer: ["developer"],
  api_client: ["api_client"],
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  guest: 0,
  worker: 10,
  client: 10,
  advertiser: 10,
  org_member: 20,
  org_admin: 30,
  developer: 35,
  api_client: 35,
  reviewer: 38,
  moderator: 40,
  support: 45,
  operations: 55,
  finance: 60,
  auditor: 50,
  admin: 80,
  super_admin: 100,
};
