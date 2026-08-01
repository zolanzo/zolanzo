"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { OTPInput } from "@/components/auth/otp-input";
import { ValidationMessage } from "@/components/auth/validation-message";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userEmail = searchParams.get("email") || "user@zolanzo.com";
  const flow = searchParams.get("flow");

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (code: string) => {
    setError("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Verification failed. Please check your code.");
        return;
      }

      if (flow === "reset-pin") {
        router.push(`/reset-pin?email=${encodeURIComponent(userEmail)}`);
      } else {
        router.push("/auth/success?type=email-verified");
      }
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        badge="Email Verification"
        title="Verify your email"
        subtitle={`We've sent a 6-digit verification code to ${userEmail}`}
      />

      <div className="space-y-6">
        <ValidationMessage message={error} />

        {/* Reusable OTP Input Component */}
        <OTPInput
          length={6}
          onComplete={(code) => {
            setOtpCode(code);
            handleVerify(code);
          }}
          onResend={() => {
            setError("");
            alert(`A new 6-digit verification code has been sent to ${userEmail}`);
          }}
          countdownSeconds={60}
        />

        {/* Verify Email Button */}
        <button
          type="button"
          onClick={() => handleVerify(otpCode)}
          disabled={loading || otpCode.length !== 6}
          className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Verify Email</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </>
          )}
        </button>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout showBackLink backLinkHref="/signup" backLinkLabel="Back">
      <Suspense fallback={<div className="text-white text-sm">Loading verification...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
