import { requireEarnerWorkspace } from "@/lib/workspace/earner";
import { EarnerWalletView } from "@/components/wallet/earner-wallet-view";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const workspace = await requireEarnerWorkspace();
  return <EarnerWalletView workspace={workspace} />;
}
