"use client";

import React, { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { OTPInput } from "@/components/auth/otp-input";
import { ValidationMessage } from "@/components/auth/validation-message";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { EMAIL_OTP_PURPOSE } from "@/lib/auth/email-otp-constants";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = (searchParams.get("email") || "").trim();
  const flow = searchParams.get("flow");
  const isPinReset = flow === "reset-pin";
  const purpose = isPinReset
    ? EMAIL_OTP_PURPOSE.pinReset
    : EMAIL_OTP_PURPOSE.emailVerification;

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const handleVerify = async (code: string) => {
    if (inFlight.current) return;
    setError("");
    setInfo("");
    if (!userEmail) {
      setError("Open this page from signup or use the link we sent with your email address.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    inFlight.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code, purpose }),
      });

      const data = await res.json();
      setLoading(false);
      inFlight.current = false;

      if (!res.ok) {
        setError(data.error || "Verification failed. Please check your code.");
        return;
      }

      if (isPinReset) {
        router.push(`/reset-pin?email=${encodeURIComponent(userEmail)}`);
      } else {
        router.push(`/auth/success?type=email-verified&email=${encodeURIComponent(userEmail)}`);
      }
    } catch {
      setLoading(false);
      inFlight.current = false;
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!userEmail) {
      throw new Error("Missing email address.");
    }
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, purpose }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not resend the verification code.");
    }
    setError("");
    setInfo("A new verification code has been sent.");
  };

  return (
    <AuthLayout
      showBackLink
      backLinkHref={isPinReset ? "/forgot-pin" : "/signup"}
      backLinkLabel="Back"
    >
      <AuthCard>
        <AuthHeader
          badge={isPinReset ? "PIN Recovery" : "Email Verification"}
          title={isPinReset ? "Enter your recovery code" : "Verify your email"}
          subtitle={
            userEmail
              ? isPinReset
                ? `We've sent a 6-digit PIN recovery code to ${userEmail}`
                : `We've sent a 6-digit verification code to ${userEmail}`
              : "Enter the 6-digit code from your ZOLANZO email."
          }
        />

        <div className="space-y-6">
          <ValidationMessage message={error} />
          {info ? <p className="text-sm font-medium text-primary">{info}</p> : null}

          <OTPInput
            length={6}
            onComplete={(code) => {
              setOtpCode(code);
              void handleVerify(code);
            }}
            onResend={handleResend}
            countdownSeconds={60}
          />

          <button
            type="button"
            onClick={() => handleVerify(otpCode)}
            disabled={loading || otpCode.length !== 6 || !userEmail}
            className="primary-action flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <span>{isPinReset ? "Confirm code" : "Verify Email"}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </>
            )}
          </button>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading verification...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
