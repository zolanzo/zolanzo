"use client";

import React from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { OpportunityCard } from "@/components/marketplace/opportunity-card";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";

export function EarnerDashboardView({ workspace }: { workspace: EarnerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const nextWork = workspace.opportunities.slice(0, 3);
  const inProgress = workspace.stats.totalAssignments - workspace.stats.completedAssignments;

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <section>
          <h1 className="text-lg font-black text-foreground">Overview</h1>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <MiniStat label="Open work" value={live ? String(workspace.opportunities.length) : "—"} />
          <MiniStat label="In progress" value={live ? String(Math.max(0, inProgress)) : "—"} />
          <MiniStat label="Completed" value={live ? String(workspace.stats.completedAssignments) : "—"} />
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
              title={live ? "No tasks yet" : "No tasks available"}
              description={
                live
                  ? "When campaigns go live, they will show up here."
                  : "Task listings load when the marketplace is reachable."
              }
              actionLabel="Browse tasks"
              actionHref="/tasks"
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
    <div className="bg-card border border-border rounded-2xl p-2.5">
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{label}</span>
      <span className="text-sm font-black text-foreground mt-0.5 block">{value}</span>
    </div>
  );
}
