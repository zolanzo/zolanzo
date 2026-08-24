"use client";

import React, { useState } from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/identity/user-avatar";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerWorkersView({ workspace }: { workspace: HirerWorkspace }) {
  const live = isLiveBoundary(workspace.loadState);
  const [search, setSearch] = useState("");
  const filtered = workspace.workers.filter((worker) => {
    const q = search.toLowerCase();
    return (
      worker.displayName.toLowerCase().includes(q) ||
      worker.handle.toLowerCase().includes(q)
    );
  });

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-4xl mx-auto space-y-4 pb-20">
        <div>
          <h1 className="text-xl font-black text-foreground">Workers</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {live
              ? `${workspace.platformWorkerCount} workers on the platform · ${workspace.workers.length} have assignments on your campaigns`
              : "Assigned workers load from your campaigns."}
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assigned workers"
          className="h-10 max-w-md px-3 rounded-xl border border-border text-xs"
        />
        {filtered.length === 0 ? (
          <EmptyState
            title="No assigned workers"
            description="Workers appear here after they claim work on your campaigns. Platform-wide directories are not invented."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((worker) => (
              <div key={worker.userId} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
                <UserAvatar name={worker.displayName} src={worker.avatarUrl} size={40} className="rounded-xl" />
                <div>
                  <p className="text-sm font-bold">{worker.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">@{worker.handle} · {worker.assignmentCount} assignments</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WorkspaceAppShell>
  );
}
