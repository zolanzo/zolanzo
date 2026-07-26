import "server-only";

import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/api/response";
import type { ActorContext, UserId, OrganizationId } from "@/types/domain";
import type { AccountType, ParticipationMode } from "@/types/domain";
import type { Role } from "@/constants/roles";
import type { OrgRole } from "@/constants/org-roles";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/route-policy";
import { isDatabaseConfigured } from "@/lib/validation/env";

export type SessionUser = {
  id: string;
  authSubject: string;
  email: string | null;
  accountType: AccountType;
  participation: ParticipationMode | null;
  platformRoles: Role[];
  activeOrganizationId: string | null;
  profile: {
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  } | null;
  memberships: Array<{
    organizationId: string;
    orgRole: string;
    status: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      kind: string;
      publicId: string;
    };
  }>;
};

export type AuthContext = {
  supabaseUserId: string;
  user: SessionUser;
  actor: ActorContext;
  activeOrgRole: OrgRole | null;
};

function asUserId(id: string): UserId {
  return id as UserId;
}

function asOrgId(id: string): OrganizationId {
  return id as OrganizationId;
}

export function buildActorContext(user: SessionUser): ActorContext {
  const orgId = user.activeOrganizationId;
  const membership = user.memberships.find(
    (m) => m.organizationId === orgId && m.status === "active",
  );

  return {
    userId: asUserId(user.id),
    accountType: user.accountType,
    userTypes: [],
    participation: user.participation,
    tenant: {
      organizationId: orgId ? asOrgId(orgId) : null,
      workspaceId: null,
      teamIds: [],
    },
    orgRoles: membership ? [membership.orgRole] : [],
    isAuthenticated: true,
  };
}

async function loadSessionUser(
  authSubject: string,
): Promise<SessionUser | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { authSubject },
    include: {
      profile: {
        select: {
          displayName: true,
          handle: true,
          avatarUrl: true,
        },
      },
      roles: { include: { role: true } },
      memberships: {
        where: { status: "active" },
        include: {
          organization: {
            select: { id: true, name: true, slug: true, kind: true, publicId: true },
          },
        },
      },
    },
  });

  if (!user) return null;

  const cookieStore = await cookies();
  const cookieOrg = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  let activeOrganizationId = user.activeOrganizationId;

  if (
    cookieOrg &&
    user.memberships.some(
      (m) => m.organizationId === cookieOrg && m.status === "active",
    )
  ) {
    activeOrganizationId = cookieOrg;
  }

  return {
    id: user.id,
    authSubject: user.authSubject ?? authSubject,
    email: user.email,
    accountType: user.accountType,
    participation: user.participation,
    platformRoles: user.roles.map((r) => r.role.key as Role),
    activeOrganizationId,
    profile: user.profile,
    memberships: user.memberships.map((m) => ({
      organizationId: m.organizationId,
      orgRole: m.orgRole,
      status: m.status,
      organization: m.organization,
    })),
  };
}

/**
 * Returns auth context when signed in and provisioned; otherwise null.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const sessionUser = await loadSessionUser(data.user.id);
  if (!sessionUser) return null;

  const actor = buildActorContext(sessionUser);
  const membership = sessionUser.memberships.find(
    (m) => m.organizationId === sessionUser.activeOrganizationId,
  );

  return {
    supabaseUserId: data.user.id,
    user: sessionUser,
    actor,
    activeOrgRole: (membership?.orgRole as OrgRole | undefined) ?? null,
  };
}

export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new AppError("UNAUTHENTICATED", "Authentication required", 401);
  }
  return ctx;
}

export async function getRequestIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

export async function getRequestUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent");
}
