"use client";

import React, { useState } from "react";

export default function OtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleChange = (index: number, val: string) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/welcome";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md space-y-6 text-center text-xs">
        <h1 className="text-xl font-bold tracking-tight">Enter Verification Code</h1>
        <p className="text-muted-foreground">Type the 6-digit verification code sent to your device.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                className="h-12 w-11 rounded-xl border border-border bg-input-background text-center text-lg font-bold text-foreground focus:border-primary focus:outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            className="primary-action min-h-[44px] w-full rounded-xl py-3 text-xs font-bold"
          >
            Verify & Continue
          </button>
        </form>
      </div>
    </div>
  );
}
