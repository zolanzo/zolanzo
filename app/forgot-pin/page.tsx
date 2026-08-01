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
            <label htmlFor="email" className="text-xs font-semibold text-zinc-300">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <HugeiconsIcon icon={Mail01Icon} size={18} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white text-sm focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Send Recovery Code Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Send Reset Code</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-zinc-400">
          <span>Remembered your PIN? </span>
          <Link
            href="/login"
            className="text-[#008744] hover:text-emerald-400 font-bold transition-colors"
          >
            Log In
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
