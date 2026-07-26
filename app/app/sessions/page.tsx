import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/session";
import {
  listDevices,
  listSessions,
} from "@/features/authentication/services/session-service";
import { Button } from "@/components/ui/button";
import { SessionsClient } from "./sessions-client";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/auth/sign-in?next=/app/sessions");

  const [sessions, devices] = await Promise.all([
    listSessions(ctx.user.id),
    listDevices(ctx.user.id),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Sessions & devices</h1>
        <Link href="/app">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
      </div>
      <SessionsClient
        sessions={sessions.map((s) => ({
          id: s.id,
          ip: s.ip,
          userAgent: s.userAgent,
          createdAt: s.createdAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
        }))}
        devices={devices.map((d) => ({
          id: d.id,
          name: d.name,
          lastSeenAt: d.lastSeenAt.toISOString(),
          trustedAt: d.trustedAt?.toISOString() ?? null,
        }))}
      />
    </main>
  );
}
