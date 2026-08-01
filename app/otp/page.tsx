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
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center text-xs">
        <h1 className="text-xl font-bold tracking-tight">Enter Verification Code</h1>
        <p className="text-zinc-400">Type the 6-digit verification code sent to your device.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                className="w-11 h-12 text-center text-lg font-bold rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:border-emerald-500 focus:outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all min-h-[44px]"
          >
            Verify & Continue
          </button>
        </form>
      </div>
    </div>
  );
}
