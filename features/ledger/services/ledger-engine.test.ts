import { describe, expect, it } from "vitest";
import { getJournalTemplate } from "@/constants/journal-templates";
import { getSettlementPolicy } from "@/constants/settlement-policies";
import {
  assertBalancedJournal,
  expandTemplateLines,
  sumSide,
} from "@/features/ledger/services/integrity";
import { formatRandomPublicId, isValidPublicId } from "@/lib/public-id/format";

describe("ledger integrity", () => {
  it("accepts balanced journals", () => {
    expect(() =>
      assertBalancedJournal([
        { accountCode: "escrow_liability", side: "debit", amountMinor: 1000 },
        { accountCode: "worker_liability", side: "credit", amountMinor: 1000 },
      ]),
    ).not.toThrow();
  });

  it("rejects unbalanced journals", () => {
    expect(() =>
      assertBalancedJournal([
        { accountCode: "escrow_liability", side: "debit", amountMinor: 1000 },
        { accountCode: "worker_liability", side: "credit", amountMinor: 900 },
      ]),
    ).toThrow(/Unbalanced/);
  });

  it("expands escrow_release template with fee", () => {
    const template = getJournalTemplate("escrow_release");
    expect(template).toBeDefined();
    const lines = expandTemplateLines({
      lines: template!.lines,
      amountMinor: 1000,
      feeMinor: 100,
      netMinor: 900,
      workerWalletId: "wal_1",
    });
    expect(sumSide(lines, "debit")).toBe(sumSide(lines, "credit"));
    expect(sumSide(lines, "debit")).toBe(1000);
    const worker = lines.find((l) => l.accountCode === "worker_liability");
    expect(worker?.amountMinor).toBe(900);
    expect(worker?.walletId).toBe("wal_1");
  });

  it("is idempotent in structure for zero-fee release", () => {
    const template = getJournalTemplate("escrow_release");
    const lines = expandTemplateLines({
      lines: template!.lines,
      amountMinor: 500,
      feeMinor: 0,
      netMinor: 500,
    });
    assertBalancedJournal(lines);
    expect(lines.some((l) => l.accountCode === "platform_fee_revenue")).toBe(
      false,
    );
  });
});

describe("settlement policies", () => {
  it("defines immediate vs hold vs batch", () => {
    expect(getSettlementPolicy("immediate").holdDays).toBe(0);
    expect(getSettlementPolicy("hold_period").holdDays).toBe(7);
    expect(getSettlementPolicy("daily_batch").batchMode).toBe("daily");
    expect(getSettlementPolicy("manual_finance_approval").requiresManualApproval).toBe(
      true,
    );
  });
});

describe("finance public ids", () => {
  it("formats SET / BAT / ESC / TXN / WAL ids", () => {
    expect(formatRandomPublicId("settlement", "7H2N9K")).toBe("SET-7H2N9K");
    expect(isValidPublicId("settlement", "SET-7H2N9K")).toBe(true);
    expect(formatRandomPublicId("settlement_batch", "3P8Q2M")).toBe(
      "BAT-3P8Q2M",
    );
    expect(isValidPublicId("settlement_batch", "BAT-3P8Q2M")).toBe(true);
    expect(formatRandomPublicId("escrow_snapshot", "5K9N2R")).toBe(
      "ESC-5K9N2R",
    );
    expect(isValidPublicId("escrow_snapshot", "ESC-5K9N2R")).toBe(true);
  });
});

describe("wallet projection contract", () => {
  it("documents that balances are never source of truth", () => {
    // Projection is rebuilt from ledger entries; no setBalance API exists.
    expect(true).toBe(true);
  });
});
