"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SmartPhone01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Shield01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { OTPInput } from "@/components/auth/otp-input";
import { ValidationMessage } from "@/components/auth/validation-message";
import { usePhoneVerification } from "@/hooks/use-phone-verification";

interface PhoneGateModalProps {
  isOpen: boolean;
  actionName: string;
  onVerified: () => void;
  onClose: () => void;
}

export function PhoneGateModal({ isOpen, actionName, onVerified, onClose }: PhoneGateModalProps) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[420px] max-h-[min(90dvh,40rem)] overflow-y-auto rounded-3xl border border-border bg-elevated p-6 text-foreground shadow-dialog">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle text-primary">
            <HugeiconsIcon icon={Shield01Icon} size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Verify your phone number to continue</h3>
          <p className="text-xs text-muted-foreground">
            Phone verification is required before <strong className="text-primary">{actionName}</strong>.
          </p>
        </div>

        <ValidationMessage message={error} />

        {step === "verified" ? (
          <div className="space-y-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-primary">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
              Phone verified
            </p>
            <button
              type="button"
              onClick={onVerified}
              className="primary-action h-[48px] w-full rounded-xl text-xs font-bold"
            >
              Continue
            </button>
          </div>
        ) : step === "phone" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendCode();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-foreground">Mobile Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="h-[48px] rounded-xl border border-border bg-input-background px-2.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="+234">🇳🇬 +234</option>
                </select>

                <div className="relative flex-1">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="801 234 5678"
                    className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {isValid ? (
              <button
                type="submit"
                disabled={loading}
                className="primary-action flex h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  <>
                    <span>Verify</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </>
                )}
              </button>
            ) : null}
          </form>
        ) : (
          <div className="space-y-6">
            <p className="text-center text-xs text-muted-foreground">
              Enter the 6-digit code sent to <strong className="font-mono text-foreground">{displayPhone}</strong>
            </p>

            <OTPInput
              length={6}
              onComplete={(code) => {
                setOtpCode(code);
                void confirmCode(code).then((ok) => {
                  if (ok) onVerified();
                });
              }}
              onResend={() => {
                void sendCode();
              }}
              countdownSeconds={60}
            />
          </div>
        )}
      </div>
    </div>
  );
}
