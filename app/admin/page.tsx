import { redirect } from "next/navigation";
import { AppError } from "@/lib/api/response";
import { requirePermission } from "@/lib/rbac/guards";
import { getCommandCenter } from "@/features/admin/services/command-center";
import { AdminLayout } from "@/components/layout/admin-layout";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let snapshot;
  try {
    const ctx = await requirePermission("ops.command_center.read");
    const result = await getCommandCenter({
      platformRoles: ctx.user.platformRoles,
      persistSnapshot: true,
    });
    if (!result.ok) {
      redirect("/app");
    }
    snapshot = result.data;
  } catch (error) {
    if (error instanceof AppError && error.code === "UNAUTHENTICATED") {
      redirect("/auth/sign-in?next=/admin");
    }
    redirect("/app");
  }

  const overview =
    snapshot.overview.key === "platform_overview" ? snapshot.overview : null;

  return (
    <AdminLayout title="Command Center">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">Operations Platform</p>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Command Center
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Live queue health and attention signals. Operators work queues — not
            database tables.
          </p>
        </header>

        {overview ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Active campaigns", overview.activeCampaigns],
              ["Available work", overview.availableWork],
              ["Pending reviews", overview.pendingReviews],
              ["Pending withdrawals", overview.pendingWithdrawals],
              ["Pending settlements", overview.pendingSettlements],
              ["Failed notifications", overview.failedNotifications],
              ["Failed payments", overview.failedPayments],
              ["Suspended users", overview.suspendedUsers],
            ].map(([label, value]) => (
              <div key={String(label)} className="space-y-1 border-b border-border/60 pb-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Queue health</h2>
          <ul className="divide-y divide-border/60">
            {snapshot.queues.map((q) => (
              <li
                key={q.queue}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <span className="font-medium capitalize">{q.queue}</span>
                <span className="text-muted-foreground">
                  {q.pending} pending · {q.failed} failed · SLA {q.sla}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {snapshot.attention.length > 0 ? (
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-semibold">Attention</h2>
            <ul className="space-y-2 text-sm">
              {snapshot.attention.map((item) => (
                <li key={`${item.queue}-${item.message}`}>
                  <span className="uppercase tracking-wide text-muted-foreground">
                    {item.severity}
                  </span>{" "}
                  — {item.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2 text-sm text-muted-foreground">
          <p>
            Build {snapshot.health.buildVersion} · Migration{" "}
            {snapshot.health.migrationVersion}
          </p>
          <p>Generated {new Date(snapshot.generatedAt).toLocaleString()}</p>
        </section>
      </main>
    </AdminLayout>
  );
}
