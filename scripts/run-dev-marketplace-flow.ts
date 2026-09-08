/**
 * Development-only marketplace workflow against live zolanzo-dev.
 * Uses domain services (not fake UI rows). Does not touch production.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { assertDevelopmentSeedTarget } from "../lib/dev/assert-dev-seed-target";
import { prisma } from "../lib/prisma/client";
import { loadWorkerEligibilityContext } from "../features/task-marketplace/services/worker-context";
import { claimWorkOpportunity } from "../features/task-marketplace/services/claim-engine";
import { startAssignment } from "../features/assignments/services/workspace-service";
import {
  attachEvidence,
  createDraftSubmission,
  submitPackage,
} from "../features/submissions/services/submission-service";
import {
  enqueueForReview,
  recordReviewDecision,
} from "../features/verification/services/review-service";
import {
  approveCampaignForMarketplace,
  submitCampaignForReview,
} from "../features/campaigns/services/campaign-service";
import {
  canModerateMarketplaceCampaign,
  resolveCampaignClientUserId,
} from "../features/campaigns/services/moderation";
import { assertHirerReviewAccess } from "../lib/auth/resource-guards";
import { AppError } from "../lib/api/response";
import type { SessionUser } from "../lib/auth/session";
import type { Role } from "../constants/roles";
import {
  DEV_CAMPAIGN_SLUG,
  DEV_MARKETPLACE_USERS,
} from "../prisma/seed/dev-marketplace-constants";
import { generateTaskInstances } from "../features/tasks/services/task-instance-service";
import { getRoleHomePath } from "../lib/auth/proxy-access";
import { productRoleFromRbac } from "../lib/auth/product-identity";

assertDevelopmentSeedTarget();

function fail(label: string, result: { ok: false; error: { message: string } }): never {
  throw new Error(`${label}: ${result.error.message}`);
}

async function userByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: true,
      roles: { include: { role: { select: { key: true } } } },
    },
  });
  if (!user) throw new Error(`Missing fixture user ${email}`);
  return user;
}

function sessionUserFromFixture(params: {
  id: string;
  participation: "worker" | "client" | "both" | null;
  platformRoles: Role[];
  memberships: Array<{
    organizationId: string;
    orgRole: string;
    status: string;
  }>;
}): SessionUser {
  return {
    id: params.id,
    authSubject: params.id,
    email: "fixture@zolanzo.local",
    accountType: "individual",
    participation: params.participation,
    platformRoles: params.platformRoles,
    activeOrganizationId: params.memberships[0]?.organizationId ?? null,
    profile: { displayName: "Fixture", handle: "fixture", avatarUrl: null },
    memberships: params.memberships.map((m) => ({
      organizationId: m.organizationId,
      orgRole: m.orgRole,
      status: m.status,
      organization: {
        id: m.organizationId,
        name: "org",
        slug: "org",
        kind: "business",
        publicId: "ORG-DEV",
      },
    })),
  };
}

async function workerContext(userId: string, orgIds: string[]) {
  return loadWorkerEligibilityContext({ userId, organizationIds: orgIds });
}

async function ensureCampaignLive(params: {
  campaignId: string;
  status: string;
  hirerUserId: string;
  staffUserId: string;
}) {
  if (
    canModerateMarketplaceCampaign(["client"]) ||
    canModerateMarketplaceCampaign(["worker"])
  ) {
    throw new Error("Hirer/earner must not be able to self-approve campaigns");
  }

  let status = params.status;
  if (status === "draft") {
    const submitted = await submitCampaignForReview({
      id: params.campaignId,
      updatedByUserId: params.hirerUserId,
    });
    if (!submitted.ok) fail("submitCampaignForReview", submitted);
    status = submitted.data.status;
  }

  if (status === "pending_review") {
    const approved = await approveCampaignForMarketplace({
      id: params.campaignId,
      updatedByUserId: params.staffUserId,
    });
    if (!approved.ok) fail("approveCampaignForMarketplace", approved);
    status = approved.data.campaign.status;
  }

  if (status !== "active" && status !== "scheduled") {
    throw new Error(`Campaign is not live after moderation (status=${status})`);
  }
  return status;
}

async function ensureAvailableInventory(campaignId: string): Promise<void> {
  const available = await prisma.taskInstance.count({
    where: { campaignId, status: "available" },
  });
  if (available >= 2) return;

  const total = await prisma.taskInstance.count({ where: { campaignId } });
  const nextTarget = Math.min(8, total + Math.max(2 - available, 0));
  if (nextTarget <= total) return;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      targetQuantity: nextTarget,
      generationPolicyConfig: {
        policy: "fixed_quantity",
        quantity: nextTarget,
      },
    },
  });

  const generated = await generateTaskInstances({
    input: { campaignId, releaseToAvailable: true },
  });
  if (!generated.ok) fail("generateTaskInstances", generated);
}

async function submitProof(params: {
  assignmentPublicId: string;
  workerUserId: string;
  note: string;
}) {
  const started = await startAssignment({
    input: { assignmentPublicId: params.assignmentPublicId },
    actorUserId: params.workerUserId,
  });
  if (!started.ok) {
    const message = started.error.message.toLowerCase();
    if (
      !message.includes("cannot") &&
      !message.includes("status") &&
      !message.includes("transition")
    ) {
      fail("startAssignment", started);
    }
  }

  const draft = await createDraftSubmission({
    input: {
      assignmentPublicId: params.assignmentPublicId,
      metadata: {
        reviewPolicyKey: "always_human",
        settlementPolicyKey: "immediate",
      },
    },
    workerUserId: params.workerUserId,
  });
  if (!draft.ok) fail("createDraftSubmission", draft);

  const attached = await attachEvidence({
    input: {
      submissionPublicId: draft.data.submission.publicId,
      kind: "text",
      label: "Confirmation note",
      inlinePayload: params.note,
    },
    workerUserId: params.workerUserId,
  });
  if (!attached.ok) fail("attachEvidence", attached);

  const submitted = await submitPackage({
    input: { submissionPublicId: draft.data.submission.publicId },
    workerUserId: params.workerUserId,
  });
  if (!submitted.ok) fail("submitPackage", submitted);
  return submitted.data;
}

async function decide(params: {
  submissionPublicId: string;
  reviewerUserId: string;
  outcome: "approved" | "rejected";
}) {
  const enqueued = await enqueueForReview({
    input: {
      submissionPublicId: params.submissionPublicId,
      policyKey: "always_human",
    },
  });
  if (!enqueued.ok) fail("enqueueForReview", enqueued);
  if (enqueued.data.autoDecision) {
    throw new Error("Expected human review, got autoDecision");
  }
  const decided = await recordReviewDecision({
    input: {
      queueItemId: enqueued.data.queueItem.id,
      outcome: params.outcome,
      comments: `DEV fixture ${params.outcome}`,
      findings: [],
      reviewMode: "human",
    },
    reviewerUserId: params.reviewerUserId,
  });
  if (!decided.ok) fail("recordReviewDecision", decided);
  return decided.data;
}

async function main() {
  const admin = await userByEmail(DEV_MARKETPLACE_USERS.admin.email);
  const staff = await userByEmail(DEV_MARKETPLACE_USERS.staff.email);
  const worker = await userByEmail(DEV_MARKETPLACE_USERS.worker.email);
  const worker2 = await userByEmail(DEV_MARKETPLACE_USERS.worker2.email);
  const hirer = await userByEmail(DEV_MARKETPLACE_USERS.hirer.email);

  const staffKeys = staff.roles.map((row) => row.role.key as Role);
  const hirerKeys = hirer.roles.map((row) => row.role.key as Role);
  const adminKeys = admin.roles.map((row) => row.role.key as Role);

  if (productRoleFromRbac({ participation: admin.participation, roleKeys: adminKeys }) !== "admin") {
    throw new Error("Admin fixture did not resolve to product role admin");
  }
  if (productRoleFromRbac({ participation: staff.participation, roleKeys: staffKeys }) !== "staff") {
    throw new Error("Staff fixture did not resolve to product role staff");
  }
  if (getRoleHomePath("admin") !== "/lex/auth") {
    throw new Error("Admin home path drifted");
  }
  if (getRoleHomePath("staff") !== "/lex/staff") {
    throw new Error("Staff home path drifted");
  }
  if (getRoleHomePath("worker") !== "/earner/dashboard") {
    throw new Error("Earner home path drifted");
  }
  if (getRoleHomePath("employer") !== "/hirer/dashboard") {
    throw new Error("Hirer home path drifted");
  }

  if (resolveCampaignClientUserId({
    actorUserId: hirer.id,
    platformRoles: hirerKeys,
    requestedClientUserId: worker.id,
  }) !== hirer.id) {
    throw new Error("Hirer was able to spoof clientUserId");
  }

  if (canModerateMarketplaceCampaign(hirerKeys)) {
    throw new Error("Hirer fixture can moderate campaigns");
  }
  if (!canModerateMarketplaceCampaign(staffKeys)) {
    throw new Error("Staff fixture cannot moderate campaigns");
  }

  const campaign = await prisma.campaign.findFirst({
    where: { slug: DEV_CAMPAIGN_SLUG },
  });
  if (!campaign) {
    throw new Error(`Missing fixture campaign ${DEV_CAMPAIGN_SLUG}`);
  }

  const workerAsSession = sessionUserFromFixture({
    id: worker.id,
    participation: worker.participation,
    platformRoles: worker.roles.map((row) => row.role.key as Role),
    memberships: worker.memberships,
  });
  try {
    assertHirerReviewAccess({
      user: workerAsSession,
      organizationId: campaign.organizationId,
      clientUserId: campaign.clientUserId,
    });
    throw new Error("Earner was allowed to review hirer submissions");
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== "FORBIDDEN") {
      throw error;
    }
  }

  await ensureCampaignLive({
    campaignId: campaign.id,
    status: campaign.status,
    hirerUserId: hirer.id,
    staffUserId: staff.id,
  });
  await ensureAvailableInventory(campaign.id);

  const available = await prisma.taskInstance.findMany({
    where: { status: "available", campaign: { slug: DEV_CAMPAIGN_SLUG } },
    orderBy: { sequenceNumber: "asc" },
  });
  if (available.length < 1) {
    throw new Error(
      "Fixture campaign has no available inventory after generation",
    );
  }

  const workerOrgs = worker.memberships.map((m) => m.organizationId);
  const worker2Orgs = worker2.memberships.map((m) => m.organizationId);
  const ctx1 = await workerContext(worker.id, workerOrgs);
  const ctx2 = await workerContext(worker2.id, worker2Orgs);

  let assignmentPublicId: string;
  let claimedInstancePublicId: string;
  let claimConflictBlocked = false;

  if (available.length >= 1) {
    const claim1 = await claimWorkOpportunity({
      input: { instancePublicId: available[0]!.publicId, worker: ctx1 },
    });
    if (!claim1.ok) fail("claim worker1", claim1);
    assignmentPublicId = claim1.data.assignment.publicId;
    claimedInstancePublicId = available[0]!.publicId;

    const claimConflict = await claimWorkOpportunity({
      input: { instancePublicId: available[0]!.publicId, worker: ctx2 },
    });
    claimConflictBlocked = !claimConflict.ok;
    if (!claimConflictBlocked) {
      throw new Error("Second worker was able to claim the same instance");
    }
  } else {
    const existing = await prisma.assignment.findFirst({
      where: {
        workerUserId: worker.id,
        campaign: { slug: DEV_CAMPAIGN_SLUG },
      },
      include: { taskInstance: true },
    });
    if (!existing) {
      throw new Error("Need an available instance or an existing worker assignment");
    }
    assignmentPublicId = existing.publicId;
    claimedInstancePublicId = existing.taskInstance.publicId;
    const claimConflict = await claimWorkOpportunity({
      input: { instancePublicId: claimedInstancePublicId, worker: ctx2 },
    });
    claimConflictBlocked = !claimConflict.ok;
  }

  const started = await startAssignment({
    input: { assignmentPublicId },
    actorUserId: worker.id,
  });
  if (!started.ok) {
    const message = started.error.message.toLowerCase();
    if (
      !message.includes("cannot") &&
      !message.includes("status") &&
      !message.includes("transition")
    ) {
      fail("startAssignment", started);
    }
  }

  const missingEvidenceDraft = await createDraftSubmission({
    input: {
      assignmentPublicId,
      metadata: {
        reviewPolicyKey: "always_human",
        settlementPolicyKey: "immediate",
      },
    },
    workerUserId: worker.id,
  });
  let missingEvidenceBlocked = false;
  if (missingEvidenceDraft.ok) {
    const emptySubmit = await submitPackage({
      input: { submissionPublicId: missingEvidenceDraft.data.submission.publicId },
      workerUserId: worker.id,
    });
    missingEvidenceBlocked = !emptySubmit.ok;
  } else {
    missingEvidenceBlocked = true;
  }
  if (!missingEvidenceBlocked) {
    throw new Error("Submission without required evidence was accepted");
  }

  const foreignStart = await startAssignment({
    input: { assignmentPublicId },
    actorUserId: worker2.id,
  });
  if (foreignStart.ok) {
    throw new Error("Worker2 started worker1 assignment");
  }

  const pkg1 = await submitProof({
    assignmentPublicId,
    workerUserId: worker.id,
    note: "DEV confirmation: signup completed on the fixture site.",
  });

  const otherWorkerSubmit = await submitPackage({
    input: { submissionPublicId: pkg1.submission.publicId },
    workerUserId: worker2.id,
  });
  if (otherWorkerSubmit.ok) {
    throw new Error("Worker2 submitted worker1 assignment");
  }

  const approved = await decide({
    submissionPublicId: pkg1.submission.publicId,
    reviewerUserId: hirer.id,
    outcome: "approved",
  });

  const remaining = await prisma.taskInstance.findMany({
    where: {
      status: "available",
      campaign: { slug: DEV_CAMPAIGN_SLUG },
      publicId: { not: claimedInstancePublicId },
    },
    orderBy: { sequenceNumber: "asc" },
  });

  let rejectedOutcome: string | null = null;
  if (remaining.length >= 1) {
    const claim2 = await claimWorkOpportunity({
      input: { instancePublicId: remaining[0]!.publicId, worker: ctx2 },
    });
    if (!claim2.ok) fail("claim worker2 instance 2", claim2);

    const pkg2 = await submitProof({
      assignmentPublicId: claim2.data.assignment.publicId,
      workerUserId: worker2.id,
      note: "DEV confirmation: incomplete proof for rejection path.",
    });

    const rejected = await decide({
      submissionPublicId: pkg2.submission.publicId,
      reviewerUserId: hirer.id,
      outcome: "rejected",
    });
    rejectedOutcome = rejected.decision.outcome;
  }

  const duplicateApprove = await decide({
    submissionPublicId: pkg1.submission.publicId,
    reviewerUserId: hirer.id,
    outcome: "approved",
  }).catch((error: unknown) => error);

  const settlements = await prisma.settlement.findMany({
    where: { workerUserId: worker.id },
  });
  const ledger = await prisma.ledgerEntry.count();
  const wallets = await prisma.wallet.findMany({
    where: { ownerUserId: worker.id },
    include: { projection: true },
  });

  process.stdout.write(
    JSON.stringify(
      {
        authHomes: {
          admin: getRoleHomePath("admin"),
          staff: getRoleHomePath("staff"),
          worker: getRoleHomePath("worker"),
          hirer: getRoleHomePath("employer"),
        },
        hirerSelfApproveBlocked: !canModerateMarketplaceCampaign(["client"]),
        clientUserIdSpoofBlocked: true,
        earnerReviewBlocked: true,
        claim1: assignmentPublicId,
        claimConflict: claimConflictBlocked,
        missingEvidenceBlocked,
        foreignAssignmentBlocked: !foreignStart.ok,
        submission1: pkg1.submission.status,
        otherWorkerSubmitBlocked: !otherWorkerSubmit.ok,
        approvedOutcome: approved.decision.outcome,
        rejectedOutcome,
        duplicateApproveBlocked:
          duplicateApprove instanceof Error ||
          (duplicateApprove as { ok?: boolean })?.ok === false,
        settlements: settlements.map((row) => ({
          publicId: row.publicId,
          status: row.status,
          netMinor: row.netMinor,
        })),
        ledgerEntries: ledger,
        wallets: wallets.map((row) => ({
          publicId: row.publicId,
          availableMinor: row.projection?.availableMinor ?? null,
          pendingMinor: row.projection?.pendingMinor ?? null,
          lifetimeEarnedMinor: row.projection?.lifetimeEarnedMinor ?? null,
        })),
      },
      null,
      2,
    ) + "\n",
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
