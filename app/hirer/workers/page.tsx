import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerWorkersView } from "@/components/hirer/workers-view";

export const dynamic = "force-dynamic";

export default async function HirerWorkersPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerWorkersView workspace={workspace} />;
}
