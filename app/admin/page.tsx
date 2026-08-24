import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveAuthContext } from "@/lib/auth/session";
import { isLocalUiPreview } from "@/lib/dev/local-ui";
import { getCommandCenterAction } from "@/features/admin/actions/operations-actions";
import { listCampaignsAction } from "@/features/campaigns/actions/campaign-actions";
import { listReviewQueueAction } from "@/features/verification/actions/review-actions";
import { AdminOperationsView } from "@/components/admin/operations-view";
import { CoreMarketplaceQueues } from "@/components/admin/core-marketplace-queues";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";

export const dynamic = "force-dynamic";

export default async function AdminCommandCenterPage() {
  const auth = await resolveAuthContext();

  if (auth.status === "unauthenticated" && !isLocalUiPreview()) {
    redirect("/login?next=/admin");
  }

  if (auth.status !== "authenticated") {
    return (
      <AdminOperationsView
        boundary={{
          kind: auth.status === "unavailable" ? "unavailable" : "unauthenticated",
          service: auth.status === "unavailable" ? auth.service : "auth",
        }}
      >
        <EmptyQueues />
      </AdminOperationsView>
    );
  }

  let snapshot;
  let loadError: unknown;
  try {
    snapshot = await getCommandCenterAction();
  } catch (err) {
    loadError = err;
  }

  let pendingCampaigns: Awaited<ReturnType<typeof listCampaignsAction>> | null = null;
  let reviewQueue: Awaited<ReturnType<typeof listReviewQueueAction>> | null = null;
  try {
    const [campaigns, reviews] = await Promise.all([
      listCampaignsAction({ status: "pending_review" }),
      listReviewQueueAction({}),
    ]);
    pendingCampaigns = campaigns;
    reviewQueue = reviews;
  } catch (err) {
    if (!loadError) loadError = err;
  }

  const openReviews =
    reviewQueue?.ok
      ? reviewQueue.data.filter((item) =>
          ["pending", "assigned", "in_review", "escalated"].includes(item.status),
        )
      : [];
  const campaigns =
    pendingCampaigns?.ok
      ? pendingCampaigns.data.filter((row) => row.status === "pending_review")
      : [];

  if (loadError || !snapshot) {
    const unavailable = isBackendUnavailableError(loadError);
    return (
      <AdminOperationsView
        boundary={{
          kind: "unavailable",
          service: "database",
          message: unavailable
            ? "Unable to load operations queues."
            : loadError instanceof Error
              ? loadError.message
              : "Operations snapshot unavailable.",
        }}
      >
        <CoreMarketplaceQueues campaigns={campaigns} reviews={openReviews} />
        <EmptyQueues />
      </AdminOperationsView>
    );
  }

  return (
    <AdminOperationsView boundary={{ kind: "live" }}>
      {!snapshot.ok ? (
        <p className="text-sm text-muted-foreground border border-border rounded-2xl p-4 bg-card">
          {snapshot.error.message}
        </p>
      ) : (
        <>
          {snapshot.data.attention.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Needs attention
              </h2>
              <div className="space-y-2">
                {snapshot.data.attention.map((item) => (
                  <div
                    key={`${item.queue}-${item.message}`}
                    className="rounded-2xl border border-warning/20 bg-warning/10 p-3 text-xs"
                  >
                    <p className="font-bold text-warning">{item.queue}</p>
                    <p className="text-warning mt-0.5">{item.message}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Queues
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {snapshot.data.queues.map((queue) => (
                <div
                  key={queue.queue}
                  className="rounded-2xl border border-border bg-card p-3"
                >
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    {queue.queue}
                  </p>
                  <p className="text-sm font-black text-foreground mt-1">
                    {queue.pending} pending
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">SLA {queue.sla}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <CoreMarketplaceQueues campaigns={campaigns} reviews={openReviews} />
    </AdminOperationsView>
  );
}

function EmptyQueues() {
  return (
    <section className="space-y-2">
      <div className="flex gap-1 overflow-x-auto">
        {["Campaigns", "Workers", "Hirers", "Withdrawals", "Audit"].map((tab) => (
          <button
            key={tab}
            type="button"
            disabled
            className="h-9 px-3 rounded-xl text-xs font-bold bg-card border border-border text-muted-foreground"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
        No operational queues loaded.
      </div>
      <Link href="/lex/auth" className="text-xs font-bold text-primary">
        Super admin →
      </Link>
    </section>
  );
}
