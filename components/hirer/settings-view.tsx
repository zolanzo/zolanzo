"use client";

import React from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";

export function HirerSettingsView({ workspace }: { workspace: HirerWorkspace }) {
  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-xl mx-auto space-y-4 pb-20">
        <h1 className="text-xl font-black text-foreground">Hirer settings</h1>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2 text-sm">
          <p><span className="text-muted-foreground">Signed in as</span> {workspace.displayName || "Not signed in"}</p>
          <p><span className="text-muted-foreground">Organization</span> {workspace.organization?.name ?? "None"}</p>
          <p><span className="text-muted-foreground">Org role</span> {workspace.orgRole ?? "None"}</p>
        </div>
        <p className="text-xs text-foreground">
          Account email, PIN, and login settings live in Account Center. Campaign auto-approve rules are not stored yet, so they are not shown as working controls.
        </p>
        <Link href="/settings" className="text-xs font-bold text-primary">
          Open Account Center →
        </Link>
        <WhatsAppSupportLink variant="card" />
      </div>
    </WorkspaceAppShell>
  );
}
