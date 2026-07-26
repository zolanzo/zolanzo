"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTemplate } from "@/components/templates/auth-template";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { acceptInvitationAction } from "@/features/organizations/actions/org-actions";

export default function AcceptInviteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthTemplate
      title="Accept invitation"
      subtitle="Join the organization with your signed-in account"
    >
      <div className="flex flex-col gap-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {!token ? (
          <Alert variant="warning">Missing invitation token.</Alert>
        ) : (
          <Button
            loading={pending}
            fullWidth
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await acceptInvitationAction(token);
                if (!result.ok) {
                  setError(result.error.message);
                  return;
                }
                router.push("/app/organizations");
                router.refresh();
              });
            }}
          >
            Accept invitation
          </Button>
        )}
      </div>
    </AuthTemplate>
  );
}
