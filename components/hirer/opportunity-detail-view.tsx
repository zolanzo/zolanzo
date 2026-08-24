"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import {
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/features/campaigns/actions/campaign-actions";
import type { CampaignRecord } from "@/features/campaigns/types";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerOpportunityDetailView({
  workspace,
  campaign,
}: {
  workspace: HirerWorkspace;
  campaign: CampaignRecord;
}) {
  const [status, setStatus] = useState(campaign.status);
  const [busy, setBusy] = useState(false);
  const pending = workspace.pendingReviews.filter(
    (row) => row.campaignName === campaign.name,
  ).length;

  async function toggle() {
    setBusy(true);
    const result =
      status === "active"
        ? await pauseCampaignAction(campaign.id)
        : await resumeCampaignAction(campaign.id);
    setBusy(false);
    if (result.ok) setStatus(result.data.status);
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        <Link href="/hirer/opportunities" className="text-xs font-bold text-foreground">
          ← Campaigns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{status}</p>
            <h1 className="text-lg font-black text-foreground">{campaign.name}</h1>
            <p className="text-xs text-foreground mt-1">
              {campaign.publicId} · {campaign.category}
            </p>
          </div>
          <div className="flex gap-2">
            {(status === "active" || status === "paused") && (
              <button
                type="button"
                disabled={busy}
                onClick={toggle}
                className="h-10 px-4 rounded-xl border text-xs font-bold"
              >
                {status === "active" ? "Pause" : "Resume"}
              </button>
            )}
            <Link
              href="/hirer/applications"
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center"
            >
              Review ({pending})
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Mini label="Reward" value={formatNgnFromMinor(campaign.rewardPerUnitMinor)} />
          <Mini label="Approved" value={`${campaign.approvedQuantity}/${campaign.targetQuantity}`} />
          <Mini label="Spent" value={formatNgnFromMinor(campaign.spentBudgetMinor)} />
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider">Brief</h2>
          <p className="text-sm text-foreground">{campaign.description}</p>
          <p className="text-xs text-foreground">{campaign.brief.workerInstructions}</p>
        </section>
      </div>
    </WorkspaceAppShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-black mt-1">{value}</p>
    </div>
  );
}
