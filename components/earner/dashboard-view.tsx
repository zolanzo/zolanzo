"use client";

import React from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { OpportunityCard } from "@/components/marketplace/opportunity-card";
import { isLiveBoundary, marketplaceEmptyCopy } from "@/lib/workspace/data-boundary";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import type { EarnerWorkItem, EarnerWorkspace } from "@/lib/workspace/earner-types";

const ACTIVE_ASSIGNMENT_STATUSES = new Set([
  "assigned",
  "claimed",
  "started",
  "in_progress",
  "paused",
]);

function isActiveWork(item: EarnerWorkItem): boolean {
  if (item.submissionStatus && ["submitted", "validating", "validation_complete", "in_review"].includes(item.submissionStatus)) {
    return true;
  }
  return ACTIVE_ASSIGNMENT_STATUSES.has(item.assignmentStatus);
}

export function EarnerDashboardView({ workspace }: { workspace: EarnerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const nextWork = workspace.opportunities.slice(0, 3);
  const activeWork = workspace.workItems.filter(isActiveWork).slice(0, 3);
  const earnings = live ? workspace.wallet.availableLabel : "—";
  const emptyMarket = marketplaceEmptyCopy(workspace.loadState);

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="mx-auto max-w-3xl space-y-3 px-4 pb-4 sm:px-0">
        <section className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-black text-foreground">Overview</h1>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold">
              <Link href="/applications" className="text-primary">
                Applications
              </Link>
              <Link href="/wallet" className="text-primary">
                Wallet
              </Link>
            </p>
          </div>
          <Link
            href="/tasks"
            className="flex h-10 shrink-0 items-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
          >
            Find Work
          </Link>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <MiniStat label="Open tasks" value={live ? String(workspace.opportunities.length) : "—"} />
          <MiniStat label="In progress" value={live ? String(activeWork.length) : "—"} />
          <MiniStat label="Available" value={earnings} />
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Current work
          </h2>
          {activeWork.length === 0 ? (
            <EmptyState
              type="tasks"
              title={
                live
                  ? "No active tasks"
                  : workspace.loadState.kind === "unauthenticated"
                    ? "Sign in to see your work"
                    : "Work is unavailable"
              }
              description={
                live
                  ? "Claim a task to see it here."
                  : workspace.loadState.kind === "unauthenticated"
                    ? "Your assignments appear after you sign in."
                    : "Assignments load when the marketplace is reachable."
              }
              actionLabel={
                workspace.loadState.kind === "unauthenticated" ? "Log in" : "Find Work"
              }
              actionHref={
                workspace.loadState.kind === "unauthenticated"
                  ? "/login?next=/earner/dashboard"
                  : "/tasks"
              }
            />
          ) : (
            <div className="space-y-2">
              {activeWork.map((item) => (
                <Link
                  key={item.id}
                  href={`/tasks/${item.instancePublicId}/work`}
                  className="block rounded-2xl border border-border bg-card p-3"
                >
                  <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {item.submissionStatus?.replaceAll("_", " ") ??
                      item.assignmentStatus.replaceAll("_", " ")}
                    <span className="px-1">·</span>
                    {formatNgnFromMinor(item.rewardMinor)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Available work
            </h2>
            <Link href="/tasks" className="text-xs font-bold text-primary">
              See all
            </Link>
          </div>
          {nextWork.length === 0 ? (
            <EmptyState
              type="tasks"
              title={emptyMarket.title}
              description={emptyMarket.description}
              actionLabel={emptyMarket.actionLabel ?? "Browse tasks"}
              actionHref={emptyMarket.actionHref ?? "/tasks"}
            />
          ) : (
            <div className="space-y-2">
              {nextWork.map((item) => (
                <OpportunityCard key={item.instanceId} opportunity={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceAppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-2.5">
      <span className="block text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      <span className="mt-0.5 block truncate text-sm font-black text-foreground">{value}</span>
    </div>
  );
}
