"use client";

import React from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNgnFromMinor, firstNameFromDisplayName } from "@/lib/money/ngn";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerDashboardView({ workspace }: { workspace: HirerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const firstName = firstNameFromDisplayName(workspace.displayName);
  const active = workspace.campaigns.filter((c) => c.status === "active");
  const pendingCount = workspace.pendingReviews.filter((row) =>
    ["submitted", "validating", "validation_complete", "in_review"].includes(row.status),
  ).length;

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <section className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground">
              Hello, {live ? firstName : "there"}
            </p>
            <h1 className="text-lg font-black text-foreground">Overview</h1>
          </div>
          <Link
            href="/hirer/opportunities/new"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center"
          >
            Create campaign
          </Link>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Stat label="Workers available" value={live ? String(workspace.platformWorkerCount) : "—"} />
          <Stat label="Active campaigns" value={live ? String(active.length) : "—"} />
          <Stat label="Awaiting review" value={live ? String(pendingCount) : "—"} />
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Active campaigns
            </h2>
            <Link href="/hirer/opportunities" className="text-xs font-bold text-primary">
              All
            </Link>
          </div>
          {active.length === 0 ? (
            <EmptyState
              title="No active campaigns"
              description="Create a campaign to start receiving completed work."
            />
          ) : (
            <div className="space-y-2">
              {active.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/hirer/opportunities/${campaign.publicId}`}
                  className="block rounded-2xl border border-border bg-card p-3"
                >
                  <p className="text-sm font-bold text-foreground">{campaign.name}</p>
                  <p className="text-[11px] text-foreground mt-1">
                    {campaign.approvedQuantity}/{campaign.targetQuantity} approved ·{" "}
                    {formatNgnFromMinor(campaign.rewardPerUnitMinor)} / slot
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </WorkspaceAppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-2.5">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-black text-foreground mt-0.5">{value}</p>
    </div>
  );
}
