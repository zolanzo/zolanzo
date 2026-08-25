import type { ReactNode } from "react";
import { WorkspaceProviders } from "@/providers/workspace-providers";
import { AdminShell } from "@/components/shell/admin-shell";
import { getAuthContext } from "@/lib/auth/session";
import { chromeRoleFromPlatformRoles } from "@/lib/workspace/shell-nav";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getAuthContext();
  const userRole = chromeRoleFromPlatformRoles(ctx?.user.platformRoles ?? []);
  const userName = ctx?.user.profile?.displayName?.trim() || "Admin";

  return (
    <WorkspaceProviders>
      <AdminShell userName={userName} userRole={userRole || null}>
        {children}
      </AdminShell>
    </WorkspaceProviders>
  );
}
