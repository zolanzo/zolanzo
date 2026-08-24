import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerApplicationsView } from "@/components/hirer/applications-view";

export const dynamic = "force-dynamic";

export default async function HirerApplicationsPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerApplicationsView workspace={workspace} />;
}
