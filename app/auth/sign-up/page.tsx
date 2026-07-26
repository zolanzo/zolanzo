"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthTemplate } from "@/components/templates/auth-template";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { signUpAction } from "@/features/authentication/actions/auth-actions";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <AuthTemplate
      title="Create account"
      subtitle="Your personal workspace is created automatically"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          setInfo(null);
          startTransition(async () => {
            const result = await signUpAction({
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
              displayName: String(form.get("displayName") ?? ""),
              rememberMe: form.get("rememberMe") === "on",
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            if (result.data.needsEmailVerification) {
              setInfo("Check your email to verify your account, then sign in.");
              return;
            }
            router.push("/app");
            router.refresh();
          });
        }}
      >
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {info ? <Alert variant="success">{info}</Alert> : null}
        <Input name="displayName" label="Display name" required />
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
          hint="At least 8 characters"
          required
          autoComplete="new-password"
        />
        <Checkbox name="rememberMe" label="Remember me" />
        <Button type="submit" loading={pending} fullWidth>
          Create account
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthTemplate>
  );
}
