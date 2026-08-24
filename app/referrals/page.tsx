import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerShell } from "@/components/shell/earner-shell";
import { ReferralsView } from "@/components/referrals/referrals-view";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const workspace = await requireEarnerWorkspace();
  return (
    <EarnerShell workspace={workspace}>
      <ReferralsView referralUrl={workspace.referralUrl} handle={workspace.handle} />
    </EarnerShell>
  );
}
