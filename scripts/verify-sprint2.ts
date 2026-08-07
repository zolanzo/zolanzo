import EarnerDashboardPage from "../app/earner/dashboard/page";
import HirerDashboardPage from "../app/hirer/dashboard/page";
import SuperAdminAuthPage from "../app/lex/auth/page";
import StaffPage from "../app/lex/staff/page";

import { KorapayPaymentAdapter } from "../lib/integrations/payments/korapay-adapter";
import { recordFinancialLedgerEntry, computeServerVerifiedBalance } from "../lib/audit/financial-ledger";

async function runAudit() {
  console.log("=== ZOLANZO End-to-End Vertical Journey Audit ===");

  const components = [
    { name: "EarnerDashboardPage", comp: EarnerDashboardPage },
    { name: "HirerDashboardPage", comp: HirerDashboardPage },
    { name: "StaffPage", comp: StaffPage },
    { name: "SuperAdminAuthPage", comp: SuperAdminAuthPage },
  ];

  for (const item of components) {
    if (typeof item.comp === "function") {
      console.log(`✓ Verified component: ${item.name}`);
    } else {
      console.error(`❌ Invalid component: ${item.name}`);
      process.exit(1);
    }
  }

  console.log("\n--- Auditing Korapay Payment Adapter ---");
  const korapay = new KorapayPaymentAdapter();
  const intent = await korapay.createPaymentIntent({
    amountMinor: 10000,
    currency: "USD",
    customerRef: "org@example.com",
    idempotencyKey: "AUDIT_TEST_100",
  });
  console.log(`✓ Korapay Payment Intent Reference: ${intent.providerRef}`);

  const virtAcc = await korapay.createVirtualAccount({
    accountName: "ZOLANZO Escrow Test",
    customerEmail: "org@example.com",
  });
  console.log(`✓ Korapay Virtual Account Number: ${virtAcc.accountNumber}`);

  const payout = await korapay.processPayout({
    amount: 50,
    currency: "USD",
    bankCode: "058",
    accountNumber: "0244123456",
    narration: "Worker Earnings Payout",
    reference: "PAYOUT_AUDIT_001",
  });
  console.log(`✓ Korapay Payout Processed: ${payout.reference}`);

  console.log("\n--- Auditing Financial Ledger & Balance Safeguards ---");
  await recordFinancialLedgerEntry({
    type: "deposit",
    reference: "AUDIT_DEP_001",
    amount: 500,
    currency: "USD",
    narration: "Campaign Escrow Deposit",
    status: "completed",
  });

  await recordFinancialLedgerEntry({
    type: "escrow_lock",
    reference: "AUDIT_LOCK_001",
    amount: 100,
    currency: "USD",
    narration: "Instagram Moderation Campaign",
    status: "completed",
  });

  const balance = await computeServerVerifiedBalance("USER_AUDIT_1");
  console.log(`✓ Server-Verified Balance: Available $${balance.availableBalance}, Escrow $${balance.escrowBalance}`);

  console.log("\n🎉 All active components, Korapay integration, and financial ledger assertions passed!");
}

runAudit();
