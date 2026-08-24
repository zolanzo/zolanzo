import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { CreateOpportunityView } from "@/components/hirer/create-opportunity-view";

export const dynamic = "force-dynamic";

export default async function CreateOpportunityPage() {
  const workspace = await requireHirerWorkspace();
  return <CreateOpportunityView workspace={workspace} />;
}
