import type { ReactNode } from "react";
import { WorkspaceProviders } from "@/providers/workspace-providers";
import { AdminShell } from "@/components/shell/admin-shell";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WorkspaceProviders>
      <AdminShell>{children}</AdminShell>
    </WorkspaceProviders>
  );
}
