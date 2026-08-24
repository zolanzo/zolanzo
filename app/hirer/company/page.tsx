import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerCompanyView } from "@/components/hirer/company-view";

export const dynamic = "force-dynamic";

export default async function HirerCompanyPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerCompanyView workspace={workspace} />;
}
