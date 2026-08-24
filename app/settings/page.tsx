import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { AccountCenter } from "@/components/settings/account-center";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const workspace = await requireEarnerWorkspace();
  return <AccountCenter workspace={workspace} />;
}
