import { describe, expect, it } from "vitest";
import { getWithdrawalPolicy } from "@/constants/withdrawal-policies";
import {
  evaluateWithdrawalEligibility,
  requiresManualApproval,
} from "@/features/withdrawals/services/eligibility";
import type { WalletProjectionView } from "@/features/wallet/services/projection";
import { formatSequentialPublicId, isValidPublicId, formatRandomPublicId } from "@/lib/public-id/format";
import { WITHDRAWAL_REQUEST_TRANSITIONS } from "@/constants/finance-enums";
import { assertBalancedJournal, expandTemplateLines } from "@/features/ledger/services/integrity";
import { getJournalTemplate } from "@/constants/journal-templates";

const projection = (available: number): WalletProjectionView => ({
  walletId: "wal_1",
  walletPublicId: "WAL-000001",
  currency: "NGN",
  availableMinor: available,
  pendingMinor: 0,
  heldMinor: 0,
  lifetimeEarnedMinor: available,
  lifetimePaidMinor: 0,
  lifetimeAdjustmentsMinor: 0,
  computedAt: new Date().toISOString(),
});

describe("withdrawal eligibility", () => {
  it("passes when balance and destination are valid", () => {
    const result = evaluateWithdrawalEligibility({
      amountMinor: 5_000_00,
      feeMinor: 0,
      policy: getWithdrawalPolicy("immediate"),
      projection: projection(10_000_00),
      reservedMinor: 0,
      pendingSettlementsMinor: 0,
      outstandingReviewCount: 0,
      destinationVerified: true,
      destinationKindActive: true,
      hoursSinceLastCompleted: null,
      accountVerificationLevel: "email",
    });
    expect(result.eligible).toBe(true);
    expect(result.withdrawableMinor).toBe(10_000_00);
  });

  it("fails when reserved funds reduce withdrawable", () => {
    const result = evaluateWithdrawalEligibility({
      amountMinor: 8_000_00,
      feeMinor: 0,
      policy: getWithdrawalPolicy("immediate"),
      projection: projection(10_000_00),
      reservedMinor: 5_000_00,
      pendingSettlementsMinor: 0,
      outstandingReviewCount: 0,
      destinationVerified: true,
      destinationKindActive: true,
      hoursSinceLastCompleted: null,
      accountVerificationLevel: "email",
    });
    expect(result.eligible).toBe(false);
    expect(result.withdrawableMinor).toBe(5_000_00);
  });

  it("enforces cooling period", () => {
    const result = evaluateWithdrawalEligibility({
      amountMinor: 1_000_00,
      feeMinor: 0,
      policy: getWithdrawalPolicy("cooling_period"),
      projection: projection(10_000_00),
      reservedMinor: 0,
      pendingSettlementsMinor: 0,
      outstandingReviewCount: 0,
      destinationVerified: true,
      destinationKindActive: true,
      hoursSinceLastCompleted: 10,
      accountVerificationLevel: "email",
    });
    expect(result.eligible).toBe(false);
    expect(result.checks.some((c) => c.id === "cooling_period" && !c.passed)).toBe(
      true,
    );
  });
});

describe("withdrawal policies", () => {
  it("detects threshold approval requirement", () => {
    const policy = getWithdrawalPolicy("threshold_approval");
    expect(requiresManualApproval(policy, 10_000_00)).toBe(false);
    expect(requiresManualApproval(policy, 60_000_00)).toBe(true);
    expect(requiresManualApproval(getWithdrawalPolicy("manual_approval"), 100)).toBe(
      true,
    );
  });
});

describe("withdrawal lifecycle transitions", () => {
  it("allows pending_approval → approved → processing → completed", () => {
    expect(
      WITHDRAWAL_REQUEST_TRANSITIONS.pending_approval.includes("approved"),
    ).toBe(true);
    expect(WITHDRAWAL_REQUEST_TRANSITIONS.approved.includes("processing")).toBe(
      true,
    );
    expect(WITHDRAWAL_REQUEST_TRANSITIONS.processing.includes("completed")).toBe(
      true,
    );
  });
});

describe("withdrawal ledger posting", () => {
  it("balances withdrawal_request template", () => {
    const template = getJournalTemplate("withdrawal_request");
    expect(template).toBeDefined();
    const lines = expandTemplateLines({
      lines: template!.lines,
      amountMinor: 1000,
      feeMinor: 0,
      netMinor: 1000,
      workerWalletId: "wal_1",
    });
    assertBalancedJournal(lines);
    expect(lines.some((l) => l.accountCode === "withdrawal_clearing")).toBe(true);
  });
});

describe("withdrawal public ids", () => {
  it("formats WDR sequential and BATW random", () => {
    const wdr = formatSequentialPublicId("withdrawal", 832);
    expect(wdr).toBe("WDR-000832");
    expect(isValidPublicId("withdrawal", wdr)).toBe(true);
    const batw = formatRandomPublicId("withdrawal_batch", "4K8N2P");
    expect(batw).toBe("BATW-4K8N2P");
    expect(isValidPublicId("withdrawal_batch", batw)).toBe(true);
  });
});
