"use client";

import React, { useState } from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/providers/toast-provider";
import { formatNgnFromMinor, nairaToMinor } from "@/lib/money/ngn";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";
import {
  confirmWithdrawalIntentAction,
  createWithdrawalIntentAction,
} from "@/features/withdrawals/actions/withdrawal-actions";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";

export function EarnerWalletView({ workspace }: { workspace: EarnerWorkspace }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = isLiveBoundary(workspace.loadState);

  const naira = Number(amount);
  const amountMinor = Number.isFinite(naira) && naira > 0 ? nairaToMinor(naira) : 0;
  const canWithdraw = live && Boolean(workspace.bank?.verified) && amountMinor > 0 && !busy;

  async function withdraw() {
    if (!live) {
      toast({ title: "Unable to load your wallet", variant: "warning" });
      return;
    }
    if (!workspace.bank) {
      toast({ title: "Add a verified bank account first", variant: "warning" });
      return;
    }
    setBusy(true);
    const intent = await createWithdrawalIntentAction({
      amountMinor,
      currency: "NGN",
      destinationAccountId: workspace.bank.id,
    });
    if (!intent.ok) {
      setBusy(false);
      toast({ title: intent.error.message, variant: "danger" });
      return;
    }
    if (!intent.data.eligibility.eligible) {
      setBusy(false);
      const failed = intent.data.eligibility.checks.find((c) => !c.passed);
      toast({
        title: failed?.message ?? "Withdrawal is not available right now",
        variant: "warning",
      });
      return;
    }
    const confirmed = await confirmWithdrawalIntentAction({
      intentId: intent.data.id,
      idempotencyKey: `wdr-${workspace.userId}-${intent.data.id}`,
    });
    setBusy(false);
    if (!confirmed.ok) {
      toast({ title: confirmed.error.message, variant: "danger" });
      return;
    }
    setAmount("");
    setWithdrawOpen(false);
    toast({ title: "Withdrawal submitted", variant: "success" });
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-2xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <h1 className="text-lg font-black text-foreground">Wallet</h1>

        <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Available
              </span>
              {live ? (
                <span className="text-2xl font-black text-primary">
                  {workspace.wallet.availableLabel}
                </span>
              ) : (
                <span className="text-sm font-bold text-foreground">Unable to load your wallet</span>
              )}
            </div>
            <button
              type="button"
              disabled={!live || !workspace.bank}
              onClick={() => setWithdrawOpen((open) => !open)}
              className="h-10 px-4 rounded-xl bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground text-xs font-bold flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
              Withdraw
            </button>
          </div>
          {live ? (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="text-foreground font-medium">Pending</span>
              <span className="font-bold text-warning">{workspace.wallet.pendingLabel}</span>
            </div>
          ) : null}

          {withdrawOpen && workspace.bank ? (
            <div className="flex gap-2 pt-1">
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (₦)"
                aria-label="Withdrawal amount in naira"
                className="flex-1 h-11 px-3 rounded-xl border border-border text-sm font-bold text-foreground"
              />
              <button
                type="button"
                disabled={!canWithdraw}
                onClick={() => void withdraw()}
                className="h-11 px-4 rounded-xl bg-foreground disabled:bg-muted disabled:text-muted-foreground text-background text-xs font-bold"
              >
                {busy ? "Sending…" : "Confirm"}
              </button>
            </div>
          ) : null}
        </section>

        <section className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Bank account</h2>
          {workspace.bank ? (
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-foreground">
                  {workspace.bank.bankName ?? workspace.bank.label}
                </p>
                <p className="text-muted-foreground">
                  {workspace.bank.last4 ? `•••• ${workspace.bank.last4}` : "Linked"}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full font-bold ${
                  workspace.bank.verified
                    ? "bg-primary-subtle text-primary"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {workspace.bank.verified ? "Verified" : "Unverified"}
              </span>
            </div>
          ) : (
            <p className="text-xs text-foreground">
              No payout account yet. Support can help you link a bank.
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Transactions</h2>
          {workspace.transactions.length === 0 ? (
            <EmptyState
              type="wallet"
              title="No transactions yet"
              description="Completed and paid work will appear here."
              actionLabel="Find tasks"
              actionHref="/tasks"
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {workspace.transactions.map((tx) => (
                <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <HugeiconsIcon icon={Wallet01Icon} size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{tx.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString("en-NG")} · {tx.status}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-foreground">
                    {formatNgnFromMinor(tx.amountMinor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Withdrawal history
          </h2>
          {workspace.withdrawals.length === 0 ? (
            <p className="text-xs text-foreground px-1">No withdrawals yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
              {workspace.withdrawals.map((row) => (
                <div key={row.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-foreground">{row.publicId}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">{formatNgnFromMinor(row.amountMinor)}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">{row.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceAppShell>
  );
}
