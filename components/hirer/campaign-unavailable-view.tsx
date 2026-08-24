"use client";

import React from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import type { DataBoundary } from "@/lib/workspace/data-boundary";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function CampaignUnavailableView({
  workspace,
  boundary,
}: {
  workspace: HirerWorkspace;
  boundary?: DataBoundary;
}) {
  return (
    <WorkspaceAppShell workspace={{ ...workspace, loadState: boundary ?? workspace.loadState }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <EmptyState
          title="Unable to load this campaign"
          description="Campaign detail is not available right now."
          actionLabel="All campaigns"
          actionHref="/hirer/opportunities"
        />
      </div>
    </WorkspaceAppShell>
  );
}
