import { describe, expect, it } from "vitest";
import {
  canModerateMarketplaceCampaign,
  canPublishAfterModeration,
  canRejectCampaignReview,
} from "@/features/campaigns/services/moderation";
import { can } from "@/lib/rbac/access";
import type { ActorContext } from "@/types/domain";

const workerActor: ActorContext = {
  userId: "user_w" as ActorContext["userId"],
  accountType: "individual",
  userTypes: [],
  participation: "worker",
  tenant: {
    organizationId: null,
    workspaceId: null,
    teamIds: [],
  },
  orgRoles: [],
  isAuthenticated: true,
};

const clientActor: ActorContext = {
  ...workerActor,
  userId: "user_c" as ActorContext["userId"],
  participation: "client",
};

describe("campaign moderation rules", () => {
  it("allows publish only from pending_review or scheduled", () => {
    expect(canPublishAfterModeration("pending_review")).toBe(true);
    expect(canPublishAfterModeration("scheduled")).toBe(true);
    expect(canPublishAfterModeration("draft")).toBe(false);
    expect(canPublishAfterModeration("active")).toBe(false);
  });

  it("allows reject only from pending_review", () => {
    expect(canRejectCampaignReview("pending_review")).toBe(true);
    expect(canRejectCampaignReview("draft")).toBe(false);
    expect(canRejectCampaignReview("active")).toBe(false);
  });

  it("restricts campaign go-live to staff roles", () => {
    expect(canModerateMarketplaceCampaign(["worker"])).toBe(false);
    expect(canModerateMarketplaceCampaign(["client"])).toBe(false);
    expect(canModerateMarketplaceCampaign(["admin"])).toBe(true);
    expect(canModerateMarketplaceCampaign(["operations"])).toBe(true);
    expect(canModerateMarketplaceCampaign(["moderator"])).toBe(true);
    expect(canModerateMarketplaceCampaign(["super_admin"])).toBe(true);
  });
});

describe("marketplace RBAC", () => {
  it("allows workers to claim work and denies campaign publish permission to workers", () => {
    expect(
      can(workerActor, "marketplace.claim", { platformRoles: ["worker"] }).allowed,
    ).toBe(true);
    expect(
      can(workerActor, "campaigns.publish", { platformRoles: ["worker"] }).allowed,
    ).toBe(false);
    expect(
      can(workerActor, "submissions.review", { platformRoles: ["worker"] }).allowed,
    ).toBe(false);
    expect(
      can(workerActor, "ops.moderation.act", { platformRoles: ["worker"] }).allowed,
    ).toBe(false);
  });

  it("does not treat client publish permission as staff moderation", () => {
    expect(
      can(clientActor, "campaigns.publish", { platformRoles: ["client"] }).allowed,
    ).toBe(true);
    expect(canModerateMarketplaceCampaign(["client"])).toBe(false);
  });

  it("grants reviewers submission decisions and denies workers", () => {
    expect(
      can(workerActor, "submissions.review", {
        platformRoles: ["reviewer"],
      }).allowed,
    ).toBe(true);
  });
});
