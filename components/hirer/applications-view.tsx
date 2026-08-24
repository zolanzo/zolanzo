"use client";

import React, { useMemo, useState } from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/identity/user-avatar";
import type { HirerReviewRow, HirerWorkspace } from "@/lib/workspace/hirer-types";

function reviewLabel(status: string): "Pending" | "Accepted" | "Rejected" | "Revision Requested" | "Other" {
  if (["submitted", "validating", "validation_complete", "in_review"].includes(status)) {
    return "Pending";
  }
  if (status === "approved") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "revision_requested") return "Revision Requested";
  return "Other";
}

export function HirerApplicationsView({
  workspace,
}: {
  workspace: HirerWorkspace;
}) {
  const [filter, setFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HirerReviewRow | null>(null);

  const filtered = useMemo(() => {
    return workspace.pendingReviews.filter((row) => {
      const label = reviewLabel(row.status);
      const matchesFilter = filter === "All" || label === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        row.workerName.toLowerCase().includes(q) ||
        row.campaignName.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [workspace.pendingReviews, filter, search]);

  const pendingCount = workspace.pendingReviews.filter(
    (row) => reviewLabel(row.status) === "Pending",
  ).length;

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-4xl mx-auto space-y-4 pb-20">
        <div>
          <h1 className="text-xl font-black text-foreground">Review queue</h1>
          <p className="text-xs text-muted-foreground mt-1">{pendingCount} awaiting a decision</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {["Pending", "Accepted", "Rejected", "Revision Requested", "All"].map((tab) => (
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
            placeholder="Search worker or campaign"
            className="h-9 px-3 rounded-xl border border-border text-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="Completed work from your campaigns will appear here after earners submit proof."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row)}
                className="w-full text-left rounded-2xl border border-border bg-card p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={row.workerName} src={row.workerAvatarUrl} size={36} className="rounded-xl" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{row.workerName}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{row.campaignName}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black">{row.rewardLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{reviewLabel(row.status)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-bold">{selected.campaignName}</p>
            <p className="text-xs text-muted-foreground">
              {selected.workerName} · {selected.publicId} · {selected.status}
            </p>
            <p className="text-xs text-muted-foreground">
              Hirer approve/reject is not connected to the operations review queue yet. This panel does not invent a decision.
            </p>
            <button type="button" onClick={() => setSelected(null)} className="text-xs font-bold text-primary">
              Close
            </button>
          </div>
        ) : null}
      </div>
    </WorkspaceAppShell>
  );
}
