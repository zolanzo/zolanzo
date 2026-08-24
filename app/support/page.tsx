import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerShell } from "@/components/shell/earner-shell";
import { SupportView } from "@/components/support/support-view";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const workspace = await requireEarnerWorkspace();
  return (
    <EarnerShell workspace={workspace}>
      <SupportView />
    </EarnerShell>
  );
}
