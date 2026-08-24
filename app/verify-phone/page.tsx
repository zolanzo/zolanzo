"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SmartPhone01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { OTPInput } from "@/components/auth/otp-input";
import { ValidationMessage } from "@/components/auth/validation-message";
import { usePhoneVerification } from "@/hooks/use-phone-verification";

export default function VerifyPhonePage() {
  const {
    step,
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    setOtpCode,
    error,
    loading,
    isValid,
    displayPhone,
    sendCode,
    confirmCode,
  } = usePhoneVerification();

  return (
    <AuthLayout showBackLink backLinkHref="/settings" backLinkLabel="Settings">
      <AuthCard>
        <AuthHeader
          badge="Security Verification"
          title="Verify phone number"
          subtitle="Verify your phone number to accept tasks, withdraw funds, and create campaigns."
        />

        {step === "verified" ? (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle text-primary">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
            </div>
            <p className="text-base font-bold text-foreground">Phone verified</p>
            <Link
              href="/settings"
              className="primary-action inline-flex h-[52px] w-full items-center justify-center rounded-xl text-sm font-bold"
            >
              Continue
            </Link>
          </div>
        ) : step === "phone" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendCode();
            }}
            className="space-y-4"
          >
            <ValidationMessage message={error} />

            <div className="space-y-1.5 text-left">
              <label htmlFor="phoneNumber" className="text-xs font-semibold text-foreground">
                Mobile Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[48px] rounded-xl border border-border bg-input-background px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="+234">🇳🇬 +234</option>
                </select>

                <div className="relative flex-1">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={18} />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="801 234 5678"
                    className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {isValid ? (
              <button
                type="submit"
                disabled={loading}
                className="primary-action mt-2 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <span>Verify</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                  </>
                )}
              </button>
            ) : null}
          </form>
        ) : (
          <div className="space-y-6">
            <ValidationMessage message={error} />

            <p className="text-center text-xs text-muted-foreground">
              Enter the 6-digit code sent to{" "}
              <strong className="font-mono text-foreground">{displayPhone}</strong>
            </p>

            <OTPInput
              length={6}
              onComplete={(code) => {
                setOtpCode(code);
                void confirmCode(code);
              }}
              onResend={() => {
                void sendCode();
              }}
              countdownSeconds={60}
            />
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
