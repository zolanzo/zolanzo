import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/api/response";
import {
  assertHirerReviewAccess,
  assertCampaignAccess,
  assertSubmissionAccess,
  assertWalletAccess,
  assertOrgMember,
  assertSameUser,
} from "@/lib/auth/resource-guards";
import type { SessionUser } from "@/lib/auth/session";

function user(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user_owner",
    authSubject: "sub",
    email: "a@b.co",
    accountType: "individual",
    participation: "client",
    platformRoles: ["client"],
    activeOrganizationId: "org_1",
    profile: { displayName: "Ada", handle: "ada", avatarUrl: null },
    memberships: [
      {
        organizationId: "org_1",
        orgRole: "owner",
        status: "active",
        organization: {
          id: "org_1",
          name: "Ada",
          slug: "ada",
          kind: "personal",
          publicId: "ORG-1",
        },
      },
    ],
    ...overrides,
  };
}

describe("assertHirerReviewAccess", () => {
  it("allows the campaign client", () => {
    expect(() =>
      assertHirerReviewAccess({
        user: user(),
        organizationId: "org_1",
        clientUserId: "user_owner",
      }),
    ).not.toThrow();
  });

  it("allows an org reviewer on the owning organization", () => {
    const reviewer = user({
      id: "user_reviewer",
      memberships: [
        {
          organizationId: "org_1",
          orgRole: "reviewer",
          status: "active",
          organization: {
            id: "org_1",
            name: "Ada",
            slug: "ada",
            kind: "personal",
            publicId: "ORG-1",
          },
        },
      ],
    });
    expect(() =>
      assertHirerReviewAccess({
        user: reviewer,
        organizationId: "org_1",
        clientUserId: "someone_else",
      }),
    ).not.toThrow();
  });

  it("denies an org team member without review permission", () => {
    const member = user({
      id: "user_member",
      memberships: [
        {
          organizationId: "org_1",
          orgRole: "team_member",
          status: "active",
          organization: {
            id: "org_1",
            name: "Ada",
            slug: "ada",
            kind: "personal",
            publicId: "ORG-1",
          },
        },
      ],
    });
    expect(() =>
      assertHirerReviewAccess({
        user: member,
        organizationId: "org_1",
        clientUserId: "someone_else",
      }),
    ).toThrow(AppError);
  });

  it("denies a worker with no campaign membership", () => {
    const worker = user({
      id: "user_worker",
      participation: "worker",
      platformRoles: ["worker"],
      activeOrganizationId: "org_other",
      memberships: [
        {
          organizationId: "org_other",
          orgRole: "owner",
          status: "active",
          organization: {
            id: "org_other",
            name: "Worker",
            slug: "worker",
            kind: "personal",
            publicId: "ORG-2",
          },
        },
      ],
    });
    expect(() =>
      assertHirerReviewAccess({
        user: worker,
        organizationId: "org_1",
        clientUserId: "user_owner",
      }),
    ).toThrow(AppError);
  });
});

describe("assertCampaignAccess", () => {
  it("denies a non-member", () => {
    expect(() =>
      assertCampaignAccess({
        user: user({
          id: "stranger",
          memberships: [],
        }),
        organizationId: "org_1",
        clientUserId: "user_owner",
      }),
    ).toThrow(AppError);
  });

  it("denies a worker claiming another hirer's campaign as reviewer", () => {
    expect(() =>
      assertCampaignAccess({
        user: user({
          id: "user_worker",
          participation: "worker",
          platformRoles: ["worker"],
          memberships: [],
        }),
        organizationId: "org_1",
        clientUserId: "user_owner",
        allowStaff: false,
      }),
    ).toThrow(AppError);
  });

  it("allows platform operations to access a campaign they do not own", () => {
    expect(() =>
      assertCampaignAccess({
        user: user({
          id: "staff",
          participation: "worker",
          platformRoles: ["operations"],
          memberships: [],
        }),
        organizationId: "org_1",
        clientUserId: "user_owner",
      }),
    ).not.toThrow();
  });
});

describe("assertSubmissionAccess", () => {
  it("denies a worker accessing another worker's submission", () => {
    expect(() =>
      assertSubmissionAccess({
        workerUserId: "worker_a",
        actorUserId: "worker_b",
      }),
    ).toThrow(AppError);
  });

  it("allows the assigned worker", () => {
    expect(() =>
      assertSubmissionAccess({
        workerUserId: "worker_a",
        actorUserId: "worker_a",
      }),
    ).not.toThrow();
  });
});

describe("assertSameUser / org / wallet", () => {
  it("does not let a request-supplied actor id override another user's resource", () => {
    expect(() => assertSameUser("owner_a", "owner_b")).toThrow(AppError);
    expect(() => assertSameUser("owner_a", "owner_a")).not.toThrow();
  });

  it("denies organization access without membership", () => {
    expect(() =>
      assertOrgMember(user({ memberships: [] }), "org_1"),
    ).toThrow(AppError);
  });

  it("denies wallet access for a different owner", () => {
    expect(() =>
      assertWalletAccess({
        user: user({ id: "stranger", memberships: [] }),
        ownerUserId: "user_owner",
        organizationId: "org_1",
      }),
    ).toThrow(AppError);
  });

  it("allows the wallet owner", () => {
    expect(() =>
      assertWalletAccess({
        user: user(),
        ownerUserId: "user_owner",
        organizationId: "org_other",
      }),
    ).not.toThrow();
  });
});
