/**
 * Pure organization switching rules (unit-tested).
 */

export function canSwitchToOrganization(params: {
  memberships: Array<{ organizationId: string; status: string }>;
  targetOrganizationId: string;
}): boolean {
  return params.memberships.some(
    (m) =>
      m.organizationId === params.targetOrganizationId &&
      m.status === "active",
  );
}

export function resolveFallbackOrganizationId(params: {
  memberships: Array<{
    organizationId: string;
    status: string;
    kind: string;
  }>;
  preferredId?: string | null;
}): string | null {
  if (
    params.preferredId &&
    canSwitchToOrganization({
      memberships: params.memberships,
      targetOrganizationId: params.preferredId,
    })
  ) {
    return params.preferredId;
  }

  const personal = params.memberships.find(
    (m) => m.status === "active" && m.kind === "personal",
  );
  if (personal) return personal.organizationId;

  const first = params.memberships.find((m) => m.status === "active");
  return first?.organizationId ?? null;
}
