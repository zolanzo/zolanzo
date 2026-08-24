import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerShell } from "@/components/shell/earner-shell";
import { NotificationsView } from "@/components/notifications/notifications-view";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const workspace = await requireEarnerWorkspace();
  return (
    <EarnerShell workspace={workspace}>
      <NotificationsView />
    </EarnerShell>
  );
}
