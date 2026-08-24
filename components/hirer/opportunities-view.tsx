"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import {
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/features/campaigns/actions/campaign-actions";
import type { HirerCampaignRow, HirerWorkspace } from "@/lib/workspace/hirer-types";

function statusLabel(status: string): string {
  if (status === "active") return "Live";
  if (status === "paused") return "Paused";
  if (status === "completed") return "Completed";
  if (status === "archived" || status === "cancelled") return "Archived";
  return "Draft";
}

export function HirerOpportunitiesView({
  workspace,
}: {
  workspace: HirerWorkspace;
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<HirerCampaignRow[]>(workspace.campaigns);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = rows.filter((item) => {
    const label = statusLabel(item.status);
    const matchesFilter = filter === "All" || label === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  async function toggle(item: HirerCampaignRow) {
    setBusyId(item.id);
    const result =
      item.status === "active"
        ? await pauseCampaignAction(item.id)
        : await resumeCampaignAction(item.id);
    setBusyId(null);
    if (!result.ok) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, status: result.data.status } : row,
      ),
    );
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-4xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-black text-foreground">Campaigns</h1>
          <Link
            href="/hirer/opportunities/new"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center"
          >
            Create
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {["All", "Live", "Paused", "Completed", "Draft", "Archived"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`h-9 px-3 rounded-xl text-xs font-bold ${
                  filter === tab
                    ? "border border-primary/25 bg-primary-subtle text-primary"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns"
            className="h-9 px-3 rounded-xl border border-border text-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No campaigns"
            description="Campaigns you create will appear here. Sample campaigns are not shown."
            actionLabel="Create campaign"
            actionHref="/hirer/opportunities/new"
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <Link href={`/hirer/opportunities/${item.publicId}`} className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{item.name}</p>
                  <p className="text-[11px] text-foreground mt-1">
                    {item.category} · {formatNgnFromMinor(item.rewardPerUnitMinor)} ·{" "}
                    {item.approvedQuantity}/{item.targetQuantity} approved
                  </p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold uppercase text-foreground">
                    {statusLabel(item.status)}
                  </span>
                  {(item.status === "active" || item.status === "paused") && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => toggle(item)}
                      className="h-8 px-3 rounded-lg border border-border text-[11px] font-bold"
                    >
                      {item.status === "active" ? "Pause" : "Resume"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceAppShell>
  );
}
