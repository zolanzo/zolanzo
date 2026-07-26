"use client";

import { AuthTemplate } from "@/components/templates/auth-template";
import { Button, Input } from "@/components/ui";

export default function AuthTemplatePage() {
  return (
    <AuthTemplate
      title="Sign in"
      subtitle="Demo auth surface — no credentials are validated."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          id="email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
        <Input
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
        <Button type="submit" variant="primary" fullWidth>
          Sign in
        </Button>
      </form>
    </AuthTemplate>
  );
}
