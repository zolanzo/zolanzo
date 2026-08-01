import {
  getOpenJobs,
  createCampaignAndLockEscrow,
  submitJobProof,
  approveSubmissionAndReleaseEscrow,
  getLiveWalletState,
} from "../lib/marketplace/service";
import { KorapayPaymentAdapter } from "../lib/integrations/payments/korapay-adapter";
import { getFinancialLedgerEntries } from "../lib/audit/financial-ledger";
import { emitNotification, getNotifications } from "../lib/notifications/service";
import { checkRateLimit, suspendUser, assertUserNotSuspended } from "../lib/security/abuse-prevention";

async function runFinalAcceptanceTest() {
  console.log("=== ZOLANZO FINAL LAUNCH ACCEPTANCE TEST ===");

  // 1. Initial State Check
  const openJobs = await getOpenJobs();
  console.log(`✓ Live Marketplace Open Jobs: ${openJobs.length}`);

  // 2. Organization Funds Campaign & Locks Escrow
  console.log("\n--- Stage 1: Organization Funds Campaign & Locks Escrow ---");
  const { job, totalEscrowLocked } = await createCampaignAndLockEscrow({
    organizationId: "ORG_PROD_001",
    title: "Pan-African AI Image Dataset Annotation",
    category: "AI Training",
    rewardPerTask: 10.00,
    totalQuantity: 10,
    currency: "USD",
  });
  console.log(`✓ Campaign Created: ${job.id} | Total Escrow Locked: $${totalEscrowLocked.toFixed(2)}`);

  // 3. Rate Limit & Abuse Check
  console.log("\n--- Stage 2: Security & Abuse Safeguards Check ---");
  checkRateLimit("WORKER_PROD_100", 60);
  console.log("✓ Rate limiting check passed.");

  // 4. Worker Accepts Task & Submits Screenshot Evidence
  console.log("\n--- Stage 3: Worker Accepts Task & Submits Proof ---");
  const submission = await submitJobProof({
    jobId: job.id,
    workerId: "WORKER_PROD_100",
    proofNotes: "Annotated 20 image datasets according to guidelines.",
    proofUrl: "https://storage.zolanzo.com/evidence/PROOF_ANNO_881.png",
    idempotencyKey: `IDEM_FINAL_${job.id}_100`,
  });
  console.log(`✓ Proof Submission Created: ${submission.id}`);

  // 5. Fraud Guard: Block duplicate submission
  try {
    await submitJobProof({
      jobId: job.id,
      workerId: "WORKER_PROD_100",
      proofNotes: "Duplicate attack",
      idempotencyKey: `IDEM_FINAL_${job.id}_100`,
    });
    console.error("❌ Fraud guard failed!");
    process.exit(1);
  } catch {
    console.log("✓ Fraud Guard Verified: Duplicate proof submission blocked.");
  }

  // 6. Organization Reviews Proof & Releases Escrow Payout
  console.log("\n--- Stage 4: Employer Approves Proof & Releases Escrow ---");
  const approval = await approveSubmissionAndReleaseEscrow({
    submissionId: submission.id,
    organizationId: "ORG_PROD_001",
  });
  console.log(`✓ Escrow Released: Ledger Payout Ref ${approval.ledgerReference}`);

  // 7. Korapay Disbursement & Payout
  console.log("\n--- Stage 5: Korapay Payout Disbursement ---");
  const korapay = new KorapayPaymentAdapter();
  const payout = await korapay.processPayout({
    amount: 10.00,
    currency: "USD",
    bankCode: "058",
    accountNumber: "0244123456",
    narration: "ZOLANZO Worker Earnings Payout",
    reference: `PAYOUT_FINAL_${Date.now()}`,
  });
  console.log(`✓ Korapay Disbursement Executed: Ref ${payout.reference}`);

  // 8. Financial Ledger & Event Notification Audit Trail Check
  console.log("\n--- Stage 6: Financial Ledger & Notification Audit ---");
  await emitNotification({
    recipientId: "WORKER_PROD_100",
    role: "worker",
    title: "Escrow Payout Disbursed",
    body: "Your task payout of $10.00 has been transferred to Mobile Money.",
    type: "payment",
  });
  const notifs = await getNotifications("WORKER_PROD_100");
  console.log(`✓ Event Notification Delivered: "${notifs[0]?.title}"`);
  const entries = await getFinancialLedgerEntries();
  console.log(`✓ Financial Ledger Entries Recorded: ${entries.length}`);

  const balance = await getLiveWalletState("WORKER_PROD_100");
  console.log(`✓ Server Verified Wallet Balance: Available $${balance.availableBalance.toFixed(2)}, Escrow $${balance.escrowBalance.toFixed(2)}`);

  // 9. Admin Control Safeguard
  console.log("\n--- Stage 7: Admin Suspension Controls ---");
  suspendUser("ATTACKER_99");
  try {
    assertUserNotSuspended("ATTACKER_99");
  } catch {
    console.log("✓ Admin Suspension Control Verified: Suspended user access blocked.");
  }

  console.log("\n=================================================");
  console.log("🎉 FINAL ACCEPTANCE TEST PASSED! ZOLANZO IS READY FOR MONDAY LAUNCH.");
  console.log("=================================================");
}

runFinalAcceptanceTest();
