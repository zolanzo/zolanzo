import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerAnalyticsView } from "@/components/hirer/analytics-view";

export const dynamic = "force-dynamic";

export default async function HirerAnalyticsPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerAnalyticsView workspace={workspace} />;
}
