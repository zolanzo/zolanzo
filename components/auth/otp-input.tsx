"use client";

import React, { useRef, useState, useEffect } from "react";

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
    // Auto-focus first input on mount
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

    // Auto-advance to next box
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check completion
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
    <div className="space-y-6 w-full text-center">
      {/* 6 Individual Box Inputs */}
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
            className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] focus:ring-1 focus:ring-[#008744] text-white focus:outline-none transition-all duration-200"
            aria-label={`Digit ${idx + 1} of verification code`}
          />
        ))}
      </div>

      {/* Countdown & Resend Button */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/5">
        <span>
          {timeLeft > 0 ? (
            <span>Resend code in <strong className="text-emerald-400 font-mono">{timeLeft}s</strong></span>
          ) : (
            <span className="text-zinc-500">Didn&apos;t receive code?</span>
          )}
        </span>

        <button
          type="button"
          disabled={timeLeft > 0}
          onClick={handleResendClick}
          className={`font-semibold transition-colors ${
            timeLeft > 0
              ? "text-zinc-600 cursor-not-allowed"
              : "text-[#008744] hover:text-emerald-400 cursor-pointer underline underline-offset-4"
          }`}
        >
          Resend Code
        </button>
      </div>
    </div>
  );
}
