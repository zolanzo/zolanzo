"use client";

import { useCallback, useMemo, useState } from "react";
import { isNormalizedMsisdn } from "@/lib/integrations/notifications/sendchamp/msisdn";

export type PhoneVerifyStep = "phone" | "otp" | "verified";

function combinedPhone(countryCode: string, local: string): string {
  return `${countryCode}${local}`;
}

export function usePhoneVerification() {
  const [step, setStep] = useState<PhoneVerifyStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const phone = useMemo(
    () => combinedPhone(countryCode, phoneNumber),
    [countryCode, phoneNumber],
  );
  const isValid = isNormalizedMsisdn(phone);

  const sendCode = useCallback(async (): Promise<boolean> => {
    setError("");
    if (!isNormalizedMsisdn(phone)) {
      setError("Please enter a valid mobile phone number.");
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone }),
      });
      const data = (await res.json()) as {
        error?: string;
        alreadyVerified?: boolean;
      };
      if (!res.ok) {
        setError(data.error || "Unable to send verification code. Please try again.");
        return false;
      }
      if (data.alreadyVerified) {
        setStep("verified");
        return true;
      }
      setStep("otp");
      return true;
    } catch {
      setError("Unable to send verification code. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const confirmCode = useCallback(
    async (code: string): Promise<boolean> => {
      setError("");
      if (code.length !== 6) {
        setError("Incorrect verification code.");
        return false;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/verify-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify_otp", phone, code }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error || "Incorrect verification code.");
          return false;
        }
        setStep("verified");
        return true;
      } catch {
        setError("Unable to send verification code. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [phone],
  );

  return {
    step,
    phoneNumber,
    setPhoneNumber,
    countryCode,
    setCountryCode,
    otpCode,
    setOtpCode,
    error,
    loading,
    isValid,
    displayPhone: `${countryCode} ${phoneNumber}`,
    sendCode,
    confirmCode,
  };
}
