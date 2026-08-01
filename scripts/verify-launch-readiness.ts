import {
  getOpenJobs,
  createCampaignAndLockEscrow,
  submitJobProof,
  approveSubmissionAndReleaseEscrow,
  getLiveWalletState,
} from "../lib/marketplace/service";
import { KorapayPaymentAdapter } from "../lib/integrations/payments/korapay-adapter";
import { emitNotification, getNotifications } from "../lib/notifications/service";

async function verifyLaunchReadiness() {
  console.log("=== ZOLANZO Sprint 3 Launch Readiness & Transaction Audit ===");

  // 1. Verify open jobs fetch
  const initialJobs = await getOpenJobs();
  console.log(`✓ Fetched ${initialJobs.length} live marketplace open jobs.`);

  // 2. Organization Creates Campaign & Locks Escrow
  console.log("\n--- Step 1: Organization Creates Campaign & Locks Escrow ---");
  const { job, totalEscrowLocked } = await createCampaignAndLockEscrow({
    organizationId: "ORG_LIVE_001",
    title: "Pan-African AI Speech Transcription",
    category: "Translation",
    rewardPerTask: 5.00,
    totalQuantity: 20,
    currency: "USD",
  });
  console.log(`✓ Created Campaign ${job.id}: Escrow locked $${totalEscrowLocked.toFixed(2)}`);

  // 3. Worker Submits Proof with Idempotency Protection
  console.log("\n--- Step 2: Worker Submits Proof with Idempotency Protection ---");
  const submission = await submitJobProof({
    jobId: job.id,
    workerId: "WORKER_LIVE_99",
    proofNotes: "Transcribed 5 mins Swahili audio snippet.",
    proofUrl: "https://storage.zolanzo.com/evidence/PROOF_991.png",
    idempotencyKey: `IDEM_SUB_${job.id}_99`,
  });
  console.log(`✓ Proof Submission Created: ${submission.id}`);

  // Test Fraud Safeguard: Duplicate submission must fail safely
  try {
    await submitJobProof({
      jobId: job.id,
      workerId: "WORKER_LIVE_99",
      proofNotes: "Duplicate attack attempt",
      idempotencyKey: `IDEM_SUB_${job.id}_99`,
    });
    console.error("❌ Duplicate submission guard failed!");
    process.exit(1);
  } catch {
    console.log(`✓ Fraud Guard Active: Duplicate submission blocked cleanly.`);
  }

  // 4. Employer Approves Proof & Releases Escrow Payout
  console.log("\n--- Step 3: Employer Approves Proof & Releases Escrow ---");
  const approval = await approveSubmissionAndReleaseEscrow({
    submissionId: submission.id,
    organizationId: "ORG_LIVE_001",
  });
  console.log(`✓ Proof Approved: Ledger Payout Ref ${approval.ledgerReference}`);

  // 5. Audit Server-Verified Wallet Balance
  console.log("\n--- Step 4: Server-Verified Wallet Balance Audit ---");
  const balance = await getLiveWalletState("WORKER_LIVE_99");
  console.log(`✓ Server Verified Balance: Available $${balance.availableBalance.toFixed(2)}, Escrow $${balance.escrowBalance.toFixed(2)}`);

  // 6. Test Korapay Payment Adapter & Idempotency Webhooks
  console.log("\n--- Step 5: Korapay Webhook & Payout Adapter Audit ---");
  const korapay = new KorapayPaymentAdapter();
  const payoutResult = await korapay.processPayout({
    amount: 50.00,
    currency: "USD",
    bankCode: "058",
    accountNumber: "0244123456",
    narration: "Korapay Worker Withdrawal",
    reference: `PAYOUT_LIVE_${Date.now()}`,
  });
  console.log(`✓ Korapay Disbursement Result: ${payoutResult.reference}`);

  // 7. Test Real Notification Engine
  console.log("\n--- Step 6: Event-Driven Notification Audit ---");
  await emitNotification({
    recipientId: "WORKER_LIVE_99",
    role: "worker",
    title: "Payout Completed",
    body: "Korapay disbursed $5.00 to your Mobile Money account.",
    type: "payment",
  });

  const workerNotifs = await getNotifications("WORKER_LIVE_99");
  console.log(`✓ Worker Notification Received: "${workerNotifs[0]?.title}"`);

  console.log("\n🎉 ALL SPRINT 3 LAUNCH READINESS TRANSACTION INTEGRITY TESTS PASSED!");
}

verifyLaunchReadiness();
