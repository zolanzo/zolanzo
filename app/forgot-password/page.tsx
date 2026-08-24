"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-6 text-xs">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
            <Icons.lock size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Account Recovery</h1>
          <p className="text-muted-foreground">
            Enter your registered email address to receive password reset instructions.
          </p>
        </div>

        {sent ? (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-6 text-center">
            <div className="text-sm font-bold text-primary">Recovery Link Sent!</div>
            <p className="text-muted-foreground">Please check your email inbox for password reset link.</p>
            <Link href="/login" className="inline-block pt-2 font-bold text-primary hover:underline">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-semibold text-foreground">Email Address</label>
              <input
                required
                type="email"
                placeholder="kwame@example.com"
                className="w-full rounded-xl border border-border bg-input-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button type="submit" className="primary-action min-h-[44px] w-full rounded-xl py-3 text-xs font-bold">
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
