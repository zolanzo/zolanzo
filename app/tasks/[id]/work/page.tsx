import { OpportunityWorkView } from "@/components/marketplace/opportunity-work-view";
import { OpportunityUnavailableView } from "@/components/marketplace/opportunity-unavailable-view";
import { resolveAuthContext } from "@/lib/auth/session";
import { isLocalUiPreview } from "@/lib/dev/local-ui";
import { loadWorkOpportunityForPage } from "@/lib/workspace/load-opportunity-page";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await resolveAuthContext();
  if (auth.status === "unauthenticated" && !isLocalUiPreview()) {
    redirect("/login?next=/tasks");
  }
  if (auth.status !== "authenticated") {
    return (
      <OpportunityUnavailableView
        boundary={{
          kind: auth.status === "unavailable" ? "unavailable" : "unauthenticated",
          service: auth.status === "unavailable" ? auth.service : "auth",
        }}
      />
    );
  }

  const { id } = await params;
  const loaded = await loadWorkOpportunityForPage(id);
  if (loaded.status !== "ok") {
    return <OpportunityUnavailableView boundary={loaded.boundary} />;
  }
  return <OpportunityWorkView opportunity={loaded.opportunity} />;
}
