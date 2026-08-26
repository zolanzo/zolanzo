"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Mail01Icon, Tag01Icon, ArrowRight01Icon, MathIcon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { PINInput } from "@/components/auth/pin-input";
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

  const [num1, setNum1] = useState<number | null>(null);
  const [num2, setNum2] = useState<number | null>(null);
  const [mathAnswer, setMathAnswer] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 8) + 1);
    setNum2(Math.floor(Math.random() * 8) + 1);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
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
    if (num1 === null || num2 === null) {
      setError("Please wait a moment and try again.");
      return;
    }

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

    submitting.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, fullName, email, pin, referralCode }),
      });

      const data = await res.json();
      setLoading(false);
      submitting.current = false;

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      setLoading(false);
      submitting.current = false;
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
            <label className="text-xs font-semibold text-foreground">
              I want to...
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`h-[48px] rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 cursor-pointer ${
                  role === "worker"
                    ? "border-primary bg-primary-subtle text-foreground ring-1 ring-primary"
                    : "border-border bg-muted text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className="font-black text-primary">{role === "worker" ? "◉" : "○"}</span>
                <span>Earn</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("employer")}
                className={`h-[48px] rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all duration-200 cursor-pointer ${
                  role === "employer"
                    ? "border-accent bg-accent-subtle text-foreground ring-1 ring-accent"
                    : "border-border bg-muted text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <span className="font-black text-accent">{role === "employer" ? "◉" : "○"}</span>
                <span>Hire</span>
              </button>
            </div>
          </div>

          {/* 2. Full Name */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="fullName" className="text-xs font-semibold text-foreground">
              Full Name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={UserIcon} size={18} />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder=""
                className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* 3. Email Address */}
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
            <label htmlFor="referralCode" className="text-xs font-semibold text-foreground">
              Referral Code (Optional)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={Tag01Icon} size={18} />
              </div>
              <input
                id="referralCode"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder=""
                className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm uppercase text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* 7. Maths: What is: 4 + 7 */}
          <div className="space-y-1.5 text-left pt-1">
            <label htmlFor="mathAnswer" className="block text-xs font-semibold text-foreground">
              What is:{" "}
              <span className="font-mono font-bold text-primary">
                {num1 === null || num2 === null ? "…" : `${num1} + ${num2}`}
              </span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={MathIcon} size={18} />
              </div>
              <input
                id="mathAnswer"
                type="number"
                required
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                placeholder=""
                className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 font-mono text-sm text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* 8. Terms & Conditions Required Checkbox */}
          <div className="pt-2 text-left">
            <label className="flex cursor-pointer select-none items-start gap-2.5 text-xs text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border bg-input-background text-primary focus:ring-0"
              />
              <span className="leading-snug">
                I accept the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-bold text-primary underline underline-offset-2 transition-colors hover:text-primary-hover"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-bold text-primary underline underline-offset-2 transition-colors hover:text-primary-hover"
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
            className="primary-action mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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

        {/* Bottom Switch to Login */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="font-extrabold text-primary transition-colors hover:text-primary-hover"
          >
            Log In
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
