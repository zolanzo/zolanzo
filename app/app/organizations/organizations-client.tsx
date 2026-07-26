"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  createOrganizationAction,
  inviteMemberAction,
  leaveOrganizationAction,
  switchOrganizationAction,
} from "@/features/organizations/actions/org-actions";

export function OrganizationsClient(props: {
  activeOrganizationId: string | null;
  memberships: Array<{
    organizationId: string;
    orgRole: string;
    name: string;
    kind: string;
    publicId: string;
  }>;
  canInvite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {info ? <Alert variant="success">{info}</Alert> : null}

      <ul className="flex flex-col gap-3">
        {props.memberships.map((m) => (
          <li
            key={m.organizationId}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-muted-foreground">
                {m.publicId} · {m.kind} · {m.orgRole}
                {m.organizationId === props.activeOrganizationId
                  ? " · active"
                  : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {m.organizationId !== props.activeOrganizationId ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await switchOrganizationAction(
                        m.organizationId,
                      );
                      if (!result.ok) {
                        setError(result.error.message);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Switch
                </Button>
              ) : null}
              {m.kind !== "personal" ? (
                <Button
                  size="sm"
                  variant="outline"
                  loading={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await leaveOrganizationAction(
                        m.organizationId,
                      );
                      if (!result.ok) {
                        setError(result.error.message);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Leave
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          setInfo(null);
          startTransition(async () => {
            const result = await createOrganizationAction({
              name: String(form.get("name") ?? ""),
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            setInfo("Organization created");
            router.refresh();
          });
        }}
      >
        <h2 className="font-heading text-lg font-semibold">
          Create business organization
        </h2>
        <Input name="name" label="Organization name" required />
        <Button type="submit" loading={pending}>
          Create
        </Button>
      </form>

      {props.canInvite ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setError(null);
            setInfo(null);
            startTransition(async () => {
              const result = await inviteMemberAction({
                email: String(form.get("email") ?? ""),
                orgRole: "team_member",
              });
              if (!result.ok) {
                setError(result.error.message);
                return;
              }
              setInfo(`Invite link: ${result.data.inviteUrl}`);
            });
          }}
        >
          <h2 className="font-heading text-lg font-semibold">
            Invite member (active org)
          </h2>
          <Input name="email" type="email" label="Email" required />
          <Button type="submit" loading={pending} variant="secondary">
            Create invitation
          </Button>
        </form>
      ) : null}
    </div>
  );
}
