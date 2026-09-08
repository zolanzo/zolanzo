"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import {
  archiveCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
  submitCampaignReviewAction,
} from "@/features/campaigns/actions/campaign-actions";
import { campaignStatusLabel } from "@/lib/workspace/marketplace-copy";
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
  const [error, setError] = useState<string | null>(null);
  const pending = workspace.pendingReviews.filter(
    (row) => row.campaignName === campaign.name,
  ).length;

  async function submitForReview() {
    setBusy(true);
    setError(null);
    const result = await submitCampaignReviewAction(campaign.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setStatus(result.data.status);
  }

  async function toggle() {
    setBusy(true);
    setError(null);
    const result =
      status === "active"
        ? await pauseCampaignAction(campaign.id)
        : await resumeCampaignAction(campaign.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setStatus(result.data.status);
  }

  async function archive() {
    setBusy(true);
    setError(null);
    const result = await archiveCampaignAction(campaign.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setStatus(result.data.status);
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        <Link href="/hirer/opportunities" className="text-xs font-bold text-foreground">
          ← Campaigns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">
              {campaignStatusLabel(status)}
            </p>
            <h1 className="text-lg font-black text-foreground">{campaign.name}</h1>
            <p className="text-xs text-foreground mt-1">
              {campaign.publicId} · {campaign.category}
            </p>
            {error ? <p className="text-xs text-destructive mt-2">{error}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {status === "draft" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitForReview()}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Submit for marketplace review
              </button>
            )}
            {(status === "active" || status === "paused") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggle()}
                className="h-10 px-4 rounded-xl border border-border text-xs font-bold"
              >
                {status === "active" ? "Pause" : "Resume"}
              </button>
            )}
            {(status === "draft" || status === "completed" || status === "cancelled") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void archive()}
                className="h-10 px-4 rounded-xl border border-border text-xs font-bold"
              >
                Archive
              </button>
            )}
            <Link
              href="/hirer/applications"
              className="flex h-10 items-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
            >
              Review ({pending})
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
