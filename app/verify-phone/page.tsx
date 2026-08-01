"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SmartPhone01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { OTPInput } from "@/components/auth/otp-input";
import { ValidationMessage } from "@/components/auth/validation-message";

export default function VerifyPhonePage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber || phoneNumber.length < 8) {
      setError("Please enter a valid mobile phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", userId: "user_session", phone: `${countryCode}${phoneNumber}` }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "SMS dispatch failed.");
        return;
      }

      setStep("otp");
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setError("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit SMS code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", userId: "user_session", phone: `${countryCode}${phoneNumber}`, code }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Phone verification failed.");
        return;
      }

      router.push("/auth/success?type=phone-verified");
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  };

  return (
    <AuthLayout showBackLink backLinkHref="/" backLinkLabel="Home">
      <AuthCard>
        <AuthHeader
          badge="Security Verification"
          title="Verify phone number"
          subtitle="Verify your phone number to accept tasks, withdraw funds, and create campaigns."
        />

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <ValidationMessage message={error} />

            {/* Phone Number Field with Country Prefix */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="phoneNumber" className="text-xs font-semibold text-zinc-300">
                Mobile Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[48px] px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none focus:border-[#008744]"
                >
                  <option value="+234">🇳🇬 +234</option>
                  <option value="+233">🇬🇭 +233</option>
                  <option value="+254">🇰🇪 +254</option>
                  <option value="+27">🇿🇦 +27</option>
                </select>

                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={18} />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="801 234 5678"
                    className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white text-sm focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Send SMS Code Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send SMS Code</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <ValidationMessage message={error} />

            <p className="text-xs text-center text-zinc-400">
              We&apos;ve sent a 6-digit SMS code to{" "}
              <strong className="text-white font-mono">{countryCode} {phoneNumber}</strong>
            </p>

            {/* OTP Input Component */}
            <OTPInput
              length={6}
              onComplete={(code) => {
                setOtpCode(code);
                handleVerifyOtp(code);
              }}
              onResend={() => {
                setError("");
                alert(`SMS code resent to ${countryCode} ${phoneNumber}`);
              }}
              countdownSeconds={60}
            />

            {/* Submit Verification */}
            <button
              type="button"
              onClick={() => handleVerifyOtp(otpCode)}
              disabled={loading || otpCode.length !== 6}
              className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
