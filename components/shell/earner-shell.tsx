"use client";

import React from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";

export function EarnerShell({
  workspace,
  children,
}: {
  workspace: EarnerWorkspace;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceAppShell workspace={workspace}>
      {children}
    </WorkspaceAppShell>
  );
}
