import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerOpportunitiesView } from "@/components/hirer/opportunities-view";

export const dynamic = "force-dynamic";

export default async function HirerOpportunitiesPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerOpportunitiesView workspace={workspace} />;
}
