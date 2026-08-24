"use client";

import React, { useState } from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { fundHirerWalletAction } from "@/features/payments/actions/hirer-funding-action";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerWalletView({ workspace }: { workspace: HirerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function fund() {
    setBusy(true);
    setMessage(null);
    const result = await fundHirerWalletAction({ amountNaira: Number(amount) });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error.message);
      return;
    }
    if (result.data.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
      return;
    }
    setOpen(false);
    setMessage(
      `Payment intent ${result.data.publicId} created (${result.data.status}). Checkout is unavailable until a payment provider is configured. No funds have moved.`,
    );
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <h1 className="text-lg font-black text-foreground">Wallet</h1>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Available</p>
              <p className="mt-0.5 text-2xl font-black text-primary">
                {live ? workspace.wallet.availableLabel : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Fund
            </button>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
            <span className="text-foreground">Held / escrow</span>
            <span className="font-bold text-foreground">
              {live ? workspace.wallet.heldLabel : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground">Pending</span>
            <span className="font-bold text-warning">
              {live ? workspace.wallet.pendingLabel : "—"}
            </span>
          </div>
          {!live ? <p className="text-xs text-foreground">Unable to load your wallet.</p> : null}
        </section>

        {message ? <p className="text-xs text-foreground">{message}</p> : null}

        {open ? (
          <div
            role="dialog"
            aria-labelledby="fund-title"
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <p id="fund-title" className="text-sm font-bold text-foreground">
              Amount (₦)
            </p>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Fund amount in naira"
              className="w-full h-11 px-3 rounded-xl border border-border text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 px-4 rounded-xl border border-border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void fund()}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                {busy ? "Starting…" : "Start payment"}
              </button>
            </div>
          </div>
        ) : null}

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Transactions</h2>
          {workspace.transactions.length === 0 ? (
            <EmptyState
              type="wallet"
              title="No transactions yet"
              description="Wallet activity appears here after a real ledger entry exists."
            />
          ) : (
            <div className="space-y-2">
              {workspace.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-2xl border border-border bg-card p-3 flex justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold">{tx.title}</p>
                    <p className="text-[11px] text-foreground">
                      {tx.type} · {tx.status}
                    </p>
                  </div>
                  <p className="text-xs font-black">{formatNgnFromMinor(tx.amountMinor)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceAppShell>
  );
}
