"use client";

import React from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { initialsFromName } from "@/lib/money/ngn";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerCompanyView({ workspace }: { workspace: HirerWorkspace }) {
  const org = workspace.organization;

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-2xl mx-auto space-y-4 pb-20">
        <h1 className="text-xl font-black text-foreground">Company</h1>
        {!org ? (
          <p className="text-sm text-muted-foreground rounded-2xl border border-border bg-card p-4">
            No active organization is attached to this session.
          </p>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-foreground text-background font-black flex items-center justify-center">
                {initialsFromName(org.name)}
              </div>
              <div>
                <h2 className="text-lg font-black">{org.name}</h2>
                <p className="text-xs text-muted-foreground">@{org.slug} · {org.publicId}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Kind: {org.kind}</p>
            <p className="text-xs text-muted-foreground">Billing: {org.billingEmail}</p>
          </div>
        )}
      </div>
    </WorkspaceAppShell>
  );
}
