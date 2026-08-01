import { AppError } from "@/lib/api/response";

const suspendedUsers: Set<string> = new Set();
const suspendedOrgs: Set<string> = new Set();
const requestCounts: Map<string, { count: number; expiresAt: number }> = new Map();

/**
 * Rate Limiter Safeguard
 */
export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): void {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.expiresAt) {
    requestCounts.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }

  if (record.count >= maxRequests) {
    throw new AppError("rate_limited", "Too many requests. Please try again later.");
  }

  record.count += 1;
}

/**
 * User & Org Suspension Controls
 */
export function assertUserNotSuspended(userId: string): void {
  if (suspendedUsers.has(userId)) {
    throw new AppError("forbidden", "Account suspended for security review.");
  }
}

export function assertOrgNotSuspended(orgId: string): void {
  if (suspendedOrgs.has(orgId)) {
    throw new AppError("forbidden", "Organization suspended for compliance audit.");
  }
}

export function suspendUser(userId: string): void {
  suspendedUsers.add(userId);
}

export function suspendOrg(orgId: string): void {
  suspendedOrgs.add(orgId);
}
