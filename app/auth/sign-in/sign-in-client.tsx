"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthTemplate } from "@/components/templates/auth-template";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { signInAction } from "@/features/authentication/actions/auth-actions";

export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthTemplate title="Sign in" subtitle="Access your ZOLANZO workspace">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await signInAction({
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
              rememberMe: form.get("rememberMe") === "on",
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.push(next.startsWith("/") ? next : "/app");
            router.refresh();
          });
        }}
      >
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <Input
          name="email"
          type="email"
          label="Email"
          required
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          label="Password"
          required
          autoComplete="current-password"
        />
        <Checkbox name="rememberMe" label="Remember me" />
        <Button type="submit" loading={pending} fullWidth>
          Sign in
        </Button>
        <p className="text-sm text-muted-foreground">
          <Link href="/forgot-pin" className="text-primary underline">
            Forgot PIN?
          </Link>
          {" · "}
          <Link href="/signup" className="text-primary underline">
            Create account
          </Link>
        </p>
      </form>
    </AuthTemplate>
  );
}
