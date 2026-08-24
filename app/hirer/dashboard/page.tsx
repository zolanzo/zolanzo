import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerDashboardView } from "@/components/hirer/dashboard-view";

export const dynamic = "force-dynamic";

export default async function HirerDashboardPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerDashboardView workspace={workspace} />;
}
