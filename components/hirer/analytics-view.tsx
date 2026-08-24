"use client";

import React from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerAnalyticsView({ workspace }: { workspace: HirerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const spent = workspace.campaigns.reduce((sum, row) => sum + row.spentBudgetMinor, 0);
  const reserved = workspace.campaigns.reduce((sum, row) => sum + row.reservedBudgetMinor, 0);
  const approved = workspace.campaigns.reduce((sum, row) => sum + row.approvedQuantity, 0);
  const completed = workspace.campaigns.reduce((sum, row) => sum + row.completedQuantity, 0);

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        <h1 className="text-xl font-black text-foreground">Results</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Campaigns" value={live ? String(workspace.campaigns.length) : "—"} />
          <Stat label="Approved units" value={live ? String(approved) : "—"} />
          <Stat label="Completed units" value={live ? String(completed) : "—"} />
          <Stat label="Spend" value={live ? formatNgnFromMinor(spent) : "—"} />
        </div>
        <p className="text-xs text-foreground">
          {live
            ? `Reserved escrow ${formatNgnFromMinor(reserved)}. Totals come from your campaigns.`
            : "Results load from your campaigns when the workspace is reachable."}
        </p>
      </div>
    </WorkspaceAppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-black mt-1">{value}</p>
    </div>
  );
}
