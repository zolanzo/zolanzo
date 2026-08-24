import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { HirerWalletView } from "@/components/hirer/wallet-view";

export const dynamic = "force-dynamic";

export default async function HirerWalletPage() {
  const workspace = await requireHirerWorkspace();
  return <HirerWalletView workspace={workspace} />;
}
