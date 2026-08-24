import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerProfileView } from "@/components/profile/earner-profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const workspace = await requireEarnerWorkspace();
  return <EarnerProfileView workspace={workspace} />;
}
