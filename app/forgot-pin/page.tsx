"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { ValidationMessage } from "@/components/auth/validation-message";

export default function ForgotPinPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "PIN recovery request failed.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}&flow=reset-pin`);
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <AuthLayout showBackLink backLinkHref="/login" backLinkLabel="Back to login">
      <AuthCard>
        <AuthHeader
          badge="PIN Recovery"
          title="Forgot your PIN?"
          subtitle="Enter your registered email address to receive a 6-digit recovery code."
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidationMessage message={error} />

          {/* Email Address */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="email" className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={Mail01Icon} size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Send Recovery Code Button */}
          <button
            type="submit"
            disabled={loading}
            className="primary-action mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <span>Send Reset Code</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <span>Remembered your PIN? </span>
          <Link
            href="/login"
            className="font-bold text-primary transition-colors hover:text-primary-hover"
          >
            Log In
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
