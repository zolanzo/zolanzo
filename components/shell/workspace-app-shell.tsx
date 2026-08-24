"use client";

import React from "react";
import { AppShell } from "@/components/shell/app-shell";
import { DataBoundaryBanner } from "@/components/workspace/data-boundary-banner";
import {
  shellDisplayName,
  walletHeaderLabel,
  type DataBoundary,
} from "@/lib/workspace/data-boundary";

type WorkspaceShellSource = {
  displayName: string;
  avatarUrl: string | null;
  wallet: { availableLabel: string };
  loadState: DataBoundary;
};

export function WorkspaceAppShell({
  workspace,
  children,
  maxWidth = "default",
}: {
  workspace: WorkspaceShellSource;
  children: React.ReactNode;
  maxWidth?: "default" | "full" | "narrow";
}) {
  return (
    <AppShell
      userName={shellDisplayName(workspace.loadState, workspace.displayName)}
      avatarUrl={workspace.loadState.kind === "live" ? workspace.avatarUrl : null}
      availableBalance={walletHeaderLabel(
        workspace.loadState,
        workspace.wallet.availableLabel,
      )}
      maxWidth={maxWidth}
    >
      <div className="px-4 sm:px-0">
        <DataBoundaryBanner boundary={workspace.loadState} className="mb-2" />
      </div>
      {children}
    </AppShell>
  );
}
