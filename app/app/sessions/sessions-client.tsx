"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  revokeAllSessionsAction,
  revokeSessionAction,
} from "@/features/authentication/actions/auth-actions";

export function SessionsClient(props: {
  sessions: Array<{
    id: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
    expiresAt: string;
  }>;
  devices: Array<{
    id: string;
    name: string | null;
    lastSeenAt: string;
    trustedAt: string | null;
  }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Active sessions</h2>
        {props.sessions.length === 0 ? (
          <EmptyState
            title="No tracked sessions"
            description="Sign-ins will appear here after you use other devices or browsers."
            className="items-start py-6 text-left"
          />
        ) : (
          props.sessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
            >
              <div className="text-sm">
                <p>{session.userAgent ?? "Unknown agent"}</p>
                <p className="text-muted-foreground">
                  {session.ip ?? "no-ip"} · expires{" "}
                  {new Date(session.expiresAt).toLocaleString()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                loading={pending}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const result = await revokeSessionAction(session.id);
                    if (!result.ok) {
                      setError(result.error.message);
                      return;
                    }
                    router.refresh();
                  });
                }}
              >
                Sign out
              </Button>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Trusted devices</h2>
        {props.devices.length === 0 ? (
          <EmptyState
            title="No trusted devices"
            description="Trusted devices will show up here when available."
            className="items-start py-6 text-left"
          />
        ) : (
          props.devices.map((device) => (
            <div key={device.id} className="border-b border-border py-3 text-sm">
              <p>{device.name ?? "Device"}</p>
              <p className="text-muted-foreground">
                Last seen {new Date(device.lastSeenAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </section>

      <Button
        variant="danger"
        loading={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await revokeAllSessionsAction();
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.push("/login");
            router.refresh();
          });
        }}
      >
        Sign out all sessions
      </Button>
    </div>
  );
}
