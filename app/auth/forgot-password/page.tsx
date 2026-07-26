"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AuthTemplate } from "@/components/templates/auth-template";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { forgotPasswordAction } from "@/features/authentication/actions/auth-actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthTemplate
      title="Reset password"
      subtitle="We'll email you a secure reset link"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          setInfo(null);
          startTransition(async () => {
            const result = await forgotPasswordAction({
              email: String(form.get("email") ?? ""),
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            setInfo("If an account exists, a reset email has been sent.");
          });
        }}
      >
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}
        <Input name="email" type="email" label="Email" required />
        <Button type="submit" loading={pending} fullWidth>
          Send reset link
        </Button>
        <Link href="/auth/sign-in" className="text-sm text-primary underline">
          Back to sign in
        </Link>
      </form>
    </AuthTemplate>
  );
}
