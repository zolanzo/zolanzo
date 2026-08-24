import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerShell } from "@/components/shell/earner-shell";
import { ActivityView } from "@/components/activity/activity-view";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const workspace = await requireEarnerWorkspace();
  return (
    <EarnerShell workspace={workspace}>
      <ActivityView />
    </EarnerShell>
  );
}
