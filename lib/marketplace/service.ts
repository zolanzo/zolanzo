import { recordFinancialLedgerEntry, computeServerVerifiedBalance } from "@/lib/audit/financial-ledger";
import { AppError } from "@/lib/api/response";

export interface JobRecord {
  id: string;
  title: string;
  category: string;
  brand: string;
  reward: number;
  currency: string;
  durationMinutes: number;
  organizationId: string;
  status: "open" | "in_progress" | "submitted" | "completed" | "closed";
  requirements: string[];
}

export interface SubmissionRecord {
  id: string;
  jobId: string;
  workerId: string;
  proofNotes: string;
  proofUrl?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
}

// In-Memory Live Store backed by Financial Ledger
const jobsDb: Map<string, JobRecord> = new Map();
const submissionsDb: Map<string, SubmissionRecord> = new Map();
const idempotencyKeysProcessed: Set<string> = new Set();

// Pre-seed live initial jobs
jobsDb.set("JOB_001", {
  id: "JOB_001",
  title: "Instagram Content Moderation & Tagging",
  category: "Social Media",
  brand: "instagram",
  reward: 4.50,
  currency: "USD",
  durationMinutes: 30,
  organizationId: "ORG_001",
  status: "open",
  requirements: ["Active Instagram Account", "Screenshot proof", "Complete within 30 mins"],
});

jobsDb.set("JOB_002", {
  id: "JOB_002",
  title: "TikTok Video Tagging & Captions",
  category: "Content Creation",
  brand: "tiktok",
  reward: 6.00,
  currency: "USD",
  durationMinutes: 20,
  organizationId: "ORG_001",
  status: "open",
  requirements: ["TikTok app installed", "Tag 5 videos"],
});

/**
 * Fetch all available open jobs
 */
export async function getOpenJobs(): Promise<JobRecord[]> {
  return Array.from(jobsDb.values()).filter((j) => j.status === "open");
}

/**
 * Fetch job by ID
 */
export async function getJobById(id: string): Promise<JobRecord | null> {
  return jobsDb.get(id) || null;
}

/**
 * Create new Campaign & Lock Escrow
 */
export async function createCampaignAndLockEscrow(input: {
  organizationId: string;
  title: string;
  category: string;
  rewardPerTask: number;
  totalQuantity: number;
  currency: string;
}): Promise<{ job: JobRecord; totalEscrowLocked: number }> {
  const totalAmount = input.rewardPerTask * input.totalQuantity;
  const escrowWithFee = totalAmount * 1.05; // 5% platform fee

  // Lock Escrow in Financial Ledger
  const ledgerRef = `ESCROW_LOCK_${Date.now()}`;
  await recordFinancialLedgerEntry({
    type: "escrow_lock",
    reference: ledgerRef,
    amount: escrowWithFee,
    currency: input.currency,
    narration: `Escrow locked for campaign: ${input.title}`,
    status: "completed",
  });

  const newJob: JobRecord = {
    id: `JOB_${Date.now()}`,
    title: input.title,
    category: input.category,
    brand: "google",
    reward: input.rewardPerTask,
    currency: input.currency,
    durationMinutes: 30,
    organizationId: input.organizationId,
    status: "open",
    requirements: ["Proof screenshot", "Valid submission notes"],
  };

  jobsDb.set(newJob.id, newJob);
  return { job: newJob, totalEscrowLocked: escrowWithFee };
}

/**
 * Submit Proof for Job with Fraud Prevention & Idempotency Check
 */
export async function submitJobProof(input: {
  jobId: string;
  workerId: string;
  proofNotes: string;
  proofUrl?: string;
  idempotencyKey?: string;
}): Promise<SubmissionRecord> {
  const key = input.idempotencyKey || `${input.jobId}_${input.workerId}`;
  if (idempotencyKeysProcessed.has(key)) {
    throw new AppError("duplicate_request", "This proof submission has already been processed.");
  }

  const job = jobsDb.get(input.jobId);
  if (!job) throw new AppError("not_found", "Job not found.");

  idempotencyKeysProcessed.add(key);
  job.status = "submitted";

  const submission: SubmissionRecord = {
    id: `SUB_${Date.now()}`,
    jobId: input.jobId,
    workerId: input.workerId,
    proofNotes: input.proofNotes,
    proofUrl: input.proofUrl,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };

  submissionsDb.set(submission.id, submission);
  return submission;
}

/**
 * Approve Proof & Release Escrow to Worker Wallet
 */
export async function approveSubmissionAndReleaseEscrow(input: {
  submissionId: string;
  organizationId: string;
}): Promise<{ submission: SubmissionRecord; ledgerReference: string }> {
  const sub = submissionsDb.get(input.submissionId);
  if (!sub) throw new AppError("not_found", "Submission not found.");
  if (sub.status === "approved") {
    throw new AppError("already_approved", "Submission is already approved.");
  }

  const job = jobsDb.get(sub.jobId);
  if (!job) throw new AppError("not_found", "Associated job not found.");

  sub.status = "approved";
  job.status = "completed";

  // Record Escrow Release in Financial Ledger
  const ledgerRef = `ESCROW_RELEASE_${Date.now()}`;
  await recordFinancialLedgerEntry({
    type: "escrow_release",
    reference: ledgerRef,
    amount: job.reward,
    currency: job.currency,
    narration: `Payout released to worker ${sub.workerId} for job ${job.id}`,
    status: "completed",
  });

  return { submission: sub, ledgerReference: ledgerRef };
}

/**
 * Compute Live Server Verified Balances
 */
export async function getLiveWalletState(userId: string) {
  return computeServerVerifiedBalance(userId);
}
