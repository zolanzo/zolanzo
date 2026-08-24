import { describe, expect, it } from "vitest";
import {
  dataBoundaryDescription,
  isFixtureBoundary,
  isLiveBoundary,
  walletHeaderLabel,
} from "@/lib/workspace/data-boundary";
import {
  createPreviewEarnerWorkspace,
  createPreviewHirerWorkspace,
} from "@/lib/workspace/preview-workspace";

describe("preview workspaces", () => {
  it("are never tagged live and contain no fabricated people or balances", () => {
    const earner = createPreviewEarnerWorkspace({ kind: "unavailable", service: "database" });
    const hirer = createPreviewHirerWorkspace({ kind: "unauthenticated" });

    expect(isLiveBoundary(earner.loadState)).toBe(false);
    expect(isLiveBoundary(hirer.loadState)).toBe(false);
    expect(isFixtureBoundary(earner.loadState)).toBe(false);
    expect(earner.displayName).toBe("");
    expect(hirer.displayName).toBe("");
    expect(earner.wallet.availableLabel).toBe("");
    expect(hirer.campaigns).toEqual([]);
    expect(earner.opportunities).toEqual([]);
    expect(earner.transactions).toEqual([]);
    expect(walletHeaderLabel(earner.loadState, "₦12,350.00")).toBeUndefined();
    expect(dataBoundaryDescription(earner.loadState)).toMatch(/unavailable/i);
  });

  it("refuses to masquerade as live or fixture data", () => {
    expect(() => createPreviewEarnerWorkspace({ kind: "live" })).toThrow(/live/i);
    expect(() => createPreviewHirerWorkspace({ kind: "fixture" })).toThrow(/fixture/i);
  });
});
