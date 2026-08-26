"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { PINInput } from "@/components/auth/pin-input";
import { ValidationMessage } from "@/components/auth/validation-message";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const verifiedNotice = searchParams.get("verified") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (pin.length !== 6) {
      setError("Your PIN must contain exactly 6 numbers.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin, rememberMe }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify your details.");
        return;
      }

      if (data.data?.requiresEmailVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      const profile = data.data?.profile;
      const role = (profile?.role || "worker").toLowerCase();
      const isStaffOrAdmin = role === "admin" || role === "super_admin" || role === "staff";

      if (role === "admin" || role === "super_admin") {
        router.push("/lex/auth");
        return;
      }

      if (role === "staff") {
        router.push("/lex/staff");
        return;
      }

      if (profile && profile.onboarding_completed === false && !isStaffOrAdmin) {
        router.push("/onboarding");
        return;
      }

      if (role === "employer") {
        router.push("/hirer/dashboard");
      } else {
        router.push("/earner/dashboard");
      }
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <AuthLayout showBackLink backLinkHref="/" backLinkLabel="Home">
      <AuthCard>
        <AuthHeader
          badge="Secure Login"
          title="Welcome back"
        />

        <form
          method="post"
          action="/login"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <ValidationMessage message={error} />
          {verifiedNotice ? (
            <p className="text-sm font-medium text-primary">
              Email verified. Log in with your PIN to continue.
            </p>
          ) : null}

          {/* Email Field */}
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
                placeholder=""
                className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* PIN Field */}
          <PINInput
            id="pin"
            label="PIN"
            value={pin}
            onChange={setPin}
            placeholder=""
          />

          {/* Remember Me & Forgot PIN */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border bg-input-background text-primary focus:ring-0"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-pin"
              className="font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Forgot PIN?
            </Link>
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            disabled={loading}
            className="primary-action mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <span>Log In</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Switch to Sign Up */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <span>Don&apos;t have an account? </span>
          <Link
            href="/signup"
            className="font-extrabold text-primary transition-colors hover:text-primary-hover"
          >
            Create Account
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading login…</div>}>
      <LoginForm />
    </Suspense>
  );
}
