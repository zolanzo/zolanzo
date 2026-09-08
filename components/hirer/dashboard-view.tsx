"use client";

import React from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNgnFromMinor, firstNameFromDisplayName } from "@/lib/money/ngn";
import { campaignStatusLabel } from "@/lib/workspace/marketplace-copy";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerDashboardView({ workspace }: { workspace: HirerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const firstName = firstNameFromDisplayName(workspace.displayName);
  const campaigns = workspace.campaigns;
  const active = campaigns.filter((c) => c.status === "active");
  const pending = workspace.pendingReviews.filter((row) =>
    ["submitted", "validating", "validation_complete", "in_review"].includes(row.status),
  );

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="mx-auto max-w-3xl space-y-3 px-4 pb-4 sm:px-0">
        <section className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground">
              Hello, {live ? firstName : "there"}
            </p>
            <h1 className="text-lg font-black text-foreground">Overview</h1>
          </div>
          <Link
            href="/hirer/opportunities/new"
            className="flex h-10 items-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
          >
            Create campaign
          </Link>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Stat label="Active tasks" value={live ? String(active.length) : "—"} />
          <Stat label="Needs review" value={live ? String(pending.length) : "—"} />
          <Stat
            label="Available"
            value={live ? workspace.wallet.availableLabel : "—"}
          />
        </section>

        {pending.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Needs attention
              </h2>
              <Link href="/hirer/applications" className="text-xs font-bold text-primary">
                Review
              </Link>
            </div>
            <div className="space-y-2">
              {pending.slice(0, 3).map((row) => (
                <Link
                  key={row.id}
                  href="/hirer/applications"
                  className="block rounded-2xl border border-border bg-card p-3"
                >
                  <p className="truncate text-sm font-bold text-foreground">{row.campaignName}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {row.workerName} · {row.rewardLabel}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Campaigns
            </h2>
            <Link href="/hirer/opportunities" className="text-xs font-bold text-primary">
              All
            </Link>
          </div>
          {campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns"
              description="Create a campaign, save a draft, then submit it for staff review. It will not go live until approved."
              actionLabel="Create campaign"
              actionHref="/hirer/opportunities/new"
            />
          ) : (
            <div className="space-y-2">
              {campaigns.slice(0, 5).map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/hirer/opportunities/${campaign.publicId}`}
                  className="block rounded-2xl border border-border bg-card p-3"
                >
                  <p className="text-sm font-bold text-foreground">{campaign.name}</p>
                  <p className="mt-1 text-[11px] text-foreground">
                    {campaignStatusLabel(campaign.status)} ·{" "}
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
      <p className="mt-0.5 truncate text-lg font-black text-foreground">{value}</p>
    </div>
  );
}
