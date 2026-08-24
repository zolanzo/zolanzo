import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerTeamView } from "@/components/hirer/team-view";

export const dynamic = "force-dynamic";

export default async function HirerTeamPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerTeamView workspace={workspace} />;
}
