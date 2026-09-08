import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  campaignStatusLabel,
  claimActionErrorMessage,
  startTaskButtonLabel,
  workSessionStatusLabel,
} from "@/lib/workspace/marketplace-copy";

function source(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("marketplace UI copy", () => {
  it("does not present draft campaigns as live", () => {
    expect(campaignStatusLabel("draft")).toBe("Draft");
    expect(campaignStatusLabel("pending_review")).toBe("Pending review");
    expect(campaignStatusLabel("active")).toBe("Active");
    expect(campaignStatusLabel("paused")).toBe("Paused");
    expect(campaignStatusLabel("archived")).toBe("Archived");
  });

  it("maps claim failures without inventing inventory", () => {
    expect(claimActionErrorMessage("ALREADY_CLAIMED", "taken")).toBe("taken");
    expect(claimActionErrorMessage("CAMPAIGN_NOT_ACTIVE", "closed")).toBe(
      "closed",
    );
    expect(startTaskButtonLabel({ pending: true })).toBe("Starting…");
    expect(
      startTaskButtonLabel({ pending: false, viewerCanContinue: true }),
    ).toBe("Continue");
  });

  it("names the work session honestly", () => {
    expect(workSessionStatusLabel("claimed")).toBe("Claimed");
    expect(workSessionStatusLabel("in_progress")).toBe("Working");
    expect(workSessionStatusLabel("draft")).toBe("Evidence");
    expect(workSessionStatusLabel("in_review")).toBe("Pending review");
  });
});

describe("marketplace UI action wiring", () => {
  it("starts work through the session-bound start action", () => {
    const detail = source("components/marketplace/opportunity-detail-view.tsx");
    expect(detail).toContain("startOpportunityAction");
    expect(detail).not.toContain("getTaskAccess");
    expect(detail).not.toContain("ConnectAccountSheet");
  });

  it("submits proof through submission actions", () => {
    const work = source("components/marketplace/opportunity-work-view.tsx");
    expect(work).toContain("prepareOpportunityWorkAction");
    expect(work).toContain("submitPackageAction");
    expect(work).toContain("/submitted");
  });

  it("creates campaigns as draft and does not offer hirer publish", () => {
    const create = source("components/hirer/create-opportunity-view.tsx");
    expect(create).toContain("createHirerOpportunityAction");
    expect(create).toContain("submitCampaignReviewAction");
    expect(create).toContain("Save draft");
    expect(create).toContain("Submit for review");
    expect(create).not.toContain("approveCampaignAction");
    const detail = source("components/hirer/opportunity-detail-view.tsx");
    expect(detail).not.toContain("approveCampaignAction");
  });

  it("reviews submissions through the hirer review action", () => {
    const review = source("components/hirer/applications-view.tsx");
    expect(review).toContain("recordHirerSubmissionDecisionAction");
    expect(review).toContain("getHirerSubmissionReviewAction");
  });
});
