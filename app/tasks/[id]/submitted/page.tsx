import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { OpportunityUnavailableView } from "@/components/marketplace/opportunity-unavailable-view";
import { resolveAuthContext } from "@/lib/auth/session";
import { isLocalUiPreview } from "@/lib/dev/local-ui";
import { loadWorkOpportunityForPage } from "@/lib/workspace/load-opportunity-page";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkSubmittedPage({
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

  return (
    <AppShell>
      <div className="max-w-md mx-auto text-center space-y-4 py-10 px-4">
        <h1 className="text-lg font-black text-foreground">Submitted</h1>
        <p className="text-sm text-muted-foreground">{loaded.opportunity.title} is in review.</p>
        <Link href="/tasks" className="inline-flex h-10 px-4 rounded-xl bg-foreground text-background text-xs font-bold items-center">
          Back to tasks
        </Link>
      </div>
    </AppShell>
  );
}
