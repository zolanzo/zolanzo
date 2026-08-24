import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerDashboardView } from "@/components/earner/dashboard-view";

export const dynamic = "force-dynamic";

export default async function EarnerDashboardPage() {
  const workspace = await requireEarnerWorkspace();
  return <EarnerDashboardView workspace={workspace} />;
}
