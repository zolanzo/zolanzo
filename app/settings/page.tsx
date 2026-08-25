import { getAuthContext } from "@/lib/auth/session";
import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { chromeRoleFromPlatformRoles } from "@/lib/workspace/shell-nav";
import { AccountCenter } from "@/components/settings/account-center";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspace = await requireEarnerWorkspace();
  const ctx = await getAuthContext();
  const userRole = chromeRoleFromPlatformRoles(ctx?.user.platformRoles ?? []);
  return <AccountCenter workspace={workspace} userRole={userRole} />;
}
