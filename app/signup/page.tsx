"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Mail01Icon, Tag01Icon, ArrowRight01Icon, MathIcon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { PINInput } from "@/components/auth/pin-input";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { ValidationMessage } from "@/components/auth/validation-message";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"worker" | "employer">("worker");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Math Challenge State (Random 1-9 using lazy state initializers)
  const [num1] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [num2] = useState(() => Math.floor(Math.random() * 8) + 1);
  const [mathAnswer, setMathAnswer] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (pin.length !== 6) {
      setError("Your PIN must contain exactly 6 digits.");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match. Please verify your PIN entry.");
      return;
    }

    // Verify Math Challenge
    const expected = num1 + num2;
    if (parseInt(mathAnswer, 10) !== expected) {
      setError("Incorrect math answer. Please try again.");
      return;
    }

    // Verify Terms & Conditions Checkbox
    if (!acceptTerms) {
      setError("You must accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, fullName, email, pin, referralCode }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <AuthLayout showBackLink backLinkHref="/" backLinkLabel="Home">
      <AuthCard>
        <AuthHeader
          badge="Create Account"
          title="Join ZOLANZO"
          subtitle="Access Africa's #1 digital workforce marketplace"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <ValidationMessage message={error} />

          {/* 1. Account Type Selector (Earn vs Hire - First Field) */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-zinc-300">
              I want to...
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`h-[48px] rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 cursor-pointer ${
                  role === "worker"
                    ? "bg-[#008744]/15 border-[#008744] text-white ring-1 ring-[#008744]"
                    : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <span className="text-emerald-400 font-black">{role === "worker" ? "◉" : "○"}</span>
                <span>Earn</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("employer")}
                className={`h-[48px] rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 cursor-pointer ${
                  role === "employer"
                    ? "bg-purple-500/15 border-purple-500 text-white ring-1 ring-purple-500"
                    : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <span className="text-purple-400 font-black">{role === "employer" ? "◉" : "○"}</span>
                <span>Hire</span>
              </button>
            </div>
          </div>

          {/* 2. Full Name */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="fullName" className="text-xs font-semibold text-zinc-300">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <HugeiconsIcon icon={UserIcon} size={18} />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=""
                className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white text-sm focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* 3. Email Address */}
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
                placeholder=""
                className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white text-sm focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* 4. Create 6 Digit PIN */}
          <PINInput
            id="pin"
            label="Create 6 Digit PIN"
            value={pin}
            onChange={setPin}
            placeholder=""
          />

          {/* 5. Confirm PIN */}
          <PINInput
            id="confirmPin"
            label="Confirm PIN"
            value={confirmPin}
            onChange={setConfirmPin}
            placeholder=""
          />

          {/* 6. Referral Code (Optional) */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="referralCode" className="text-xs font-semibold text-zinc-300">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <HugeiconsIcon icon={Tag01Icon} size={18} />
              </div>
              <input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder=""
                className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white text-sm focus:outline-none transition-all duration-200 uppercase"
              />
            </div>
          </div>

          {/* 7. Maths: What is: 4 + 7 */}
          <div className="space-y-1.5 text-left pt-1">
            <label htmlFor="mathAnswer" className="text-xs font-semibold text-zinc-300 block">
              What is: <span className="text-emerald-400 font-bold font-mono">{num1} + {num2}</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                <HugeiconsIcon icon={MathIcon} size={18} />
              </div>
              <input
                id="mathAnswer"
                type="number"
                required
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                placeholder=""
                className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white text-sm focus:outline-none transition-all duration-200 font-mono"
              />
            </div>
          </div>

          {/* 8. Terms & Conditions Required Checkbox */}
          <div className="pt-2 text-left">
            <label className="flex items-start gap-2.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded bg-zinc-900 border-zinc-800 text-[#008744] focus:ring-0 cursor-pointer shrink-0"
              />
              <span className="leading-snug">
                I accept the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-[#008744] hover:text-emerald-400 font-bold underline underline-offset-2 transition-colors"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-[#008744] hover:text-emerald-400 font-bold underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Adaptive CTA Button */}
          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {role === "worker" ? "Create Earn Account" : "Create Hire Account"}
                </span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative px-3 bg-[#0A0F12] text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            OR
          </span>
        </div>

        {/* Social Registration */}
        <SocialLoginButtons />

        {/* Bottom Switch to Login */}
        <div className="mt-6 pt-4 border-t border-white/5 text-center text-xs text-zinc-400">
          <span>Already have an account? </span>
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
