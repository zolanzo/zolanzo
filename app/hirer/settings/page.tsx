import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerSettingsView } from "@/components/hirer/settings-view";

export const dynamic = "force-dynamic";

export default async function HirerSettingsPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerSettingsView workspace={workspace} />;
}
