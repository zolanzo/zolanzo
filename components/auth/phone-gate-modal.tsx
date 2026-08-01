"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SmartPhone01Icon, ArrowRight01Icon, Cancel01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { OTPInput } from "@/components/auth/otp-input";
import { ValidationMessage } from "@/components/auth/validation-message";

interface PhoneGateModalProps {
  isOpen: boolean;
  actionName: string;
  onVerified: () => void;
  onClose: () => void;
}

export function PhoneGateModal({ isOpen, actionName, onVerified, onClose }: PhoneGateModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
        body: JSON.stringify({ action: "send_otp", userId: "session_user", phone: `${countryCode}${phoneNumber}` }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Failed to send verification SMS.");
        return;
      }

      setStep("otp");
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
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
        body: JSON.stringify({ action: "verify_otp", userId: "session_user", phone: `${countryCode}${phoneNumber}`, code }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Phone verification failed.");
        return;
      }

      onVerified();
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[420px] bg-[#0A0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <HugeiconsIcon icon={Shield01Icon} size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Verify your phone number to continue</h3>
          <p className="text-xs text-zinc-400">
            Phone verification is required before <strong className="text-emerald-400">{actionName}</strong>.
          </p>
        </div>

        <ValidationMessage message={error} />

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Mobile Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[48px] px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:outline-none"
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
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="801 234 5678"
                    className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send SMS Code</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-center text-zinc-400">
              Enter the 6-digit SMS code sent to <strong className="text-white font-mono">{countryCode} {phoneNumber}</strong>
            </p>

            <OTPInput
              length={6}
              onComplete={(code) => {
                setOtpCode(code);
                handleVerifyOtp(code);
              }}
              onResend={() => {
                setError("");
                alert(`Resent SMS code to ${countryCode} ${phoneNumber}`);
              }}
              countdownSeconds={60}
            />

            <button
              type="button"
              onClick={() => handleVerifyOtp(otpCode)}
              disabled={loading || otpCode.length !== 6}
              className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
