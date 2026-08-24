import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerShell } from "@/components/shell/earner-shell";
import { ApplicationsView } from "@/components/applications/applications-view";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const workspace = await requireEarnerWorkspace();
  return (
    <EarnerShell workspace={workspace}>
      <ApplicationsView workspace={workspace} />
    </EarnerShell>
  );
}
