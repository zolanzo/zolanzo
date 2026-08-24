"use client";

import React, { useEffect, useRef, useState } from "react";

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend?: () => void;
  countdownSeconds?: number;
}

export function OTPInput({
  length = 6,
  onComplete,
  onResend,
  countdownSeconds = 60,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = newOtp.join("");
    if (joined.length === length && !newOtp.includes("")) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i] ?? "";
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === length) {
      onComplete(pastedData);
    }
  };

  const handleResendClick = () => {
    if (timeLeft > 0) return;
    setTimeLeft(countdownSeconds);
    setOtp(Array(length).fill(""));
    inputRefs.current[0]?.focus();
    if (onResend) onResend();
  };

  return (
    <div className="w-full space-y-6 text-center">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            className="h-13 w-11 rounded-xl border border-border bg-input-background text-center text-xl font-black text-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:h-14 sm:w-13 sm:text-2xl"
            aria-label={`Digit ${idx + 1} of verification code`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
        <span>
          {timeLeft > 0 ? (
            <span>
              Resend code in <strong className="font-mono text-primary">{timeLeft}s</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">Didn&apos;t receive code?</span>
          )}
        </span>

        <button
          type="button"
          disabled={timeLeft > 0}
          onClick={handleResendClick}
          className={`font-semibold transition-colors ${
            timeLeft > 0
              ? "cursor-not-allowed text-disabled"
              : "cursor-pointer text-primary underline underline-offset-4 hover:text-primary-hover"
          }`}
        >
          Resend Code
        </button>
      </div>
    </div>
  );
}
