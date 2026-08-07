"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { PINInput } from "@/components/auth/pin-input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { ValidationMessage } from "@/components/auth/validation-message";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidationMessage message={error} />

          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="email" className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400 pointer-events-none">
                <HugeiconsIcon icon={Mail01Icon} size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-slate-100 dark:bg-[#181F29] border border-slate-300 dark:border-white/[0.12] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white text-sm focus:outline-none transition-all duration-200"
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
            <label className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-[#008744] focus:ring-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-pin"
              className="text-[#008744] hover:text-emerald-400 font-semibold transition-colors"
            >
              Forgot PIN?
            </Link>
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Log In</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
          </div>
          <span className="relative px-3 bg-white dark:bg-[#101419] text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            OR
          </span>
        </div>

        {/* Social Login Architecture */}
        <SocialLoginButtons />

        {/* Bottom Switch to Sign Up */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/[0.08] text-center text-xs text-slate-600 dark:text-zinc-400">
          <span>Don&apos;t have an account? </span>
          <Link
            href="/signup"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-extrabold transition-colors"
          >
            Create Account
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
