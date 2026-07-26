"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthTemplate } from "@/components/templates/auth-template";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { updatePasswordAction } from "@/features/authentication/actions/auth-actions";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthTemplate title="Choose a new password">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await updatePasswordAction({
              password: String(form.get("password") ?? ""),
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.push("/app");
            router.refresh();
          });
        }}
      >
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Input
          name="password"
          type="password"
          label="New password"
          required
          autoComplete="new-password"
        />
        <Button type="submit" loading={pending} fullWidth>
          Update password
        </Button>
      </form>
    </AuthTemplate>
  );
}
