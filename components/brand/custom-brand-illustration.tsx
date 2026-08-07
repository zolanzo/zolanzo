"use client";

import React from "react";

export function CustomBrandIllustration({
  type,
  className = "w-28 h-28",
}: {
  type: "tasks" | "wallet" | "profile" | "referral" | "support" | "success";
  className?: string;
}) {
  return (
    <div className={`relative flex items-center justify-center ${className} select-none`}>
      {/* Background Soft Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-amber-500/20 blur-xl animate-pulse" />

      {/* Center Stylized Graphic Container */}
      <div className="relative z-10 w-full h-full rounded-3xl bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 border border-slate-200/80 shadow-medium flex flex-col items-center justify-center p-3 text-center">
        {type === "tasks" && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-3xl">🎯</span>
            <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase">Live Tasks</span>
          </div>
        )}

        {type === "wallet" && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-3xl">💰</span>
            <span className="text-[10px] font-black tracking-wider text-amber-600 uppercase">Earnings</span>
          </div>
        )}

        {type === "profile" && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-3xl">🚀</span>
            <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase">Trust 98%</span>
          </div>
        )}

        {type === "referral" && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-3xl">🎁</span>
            <span className="text-[10px] font-black tracking-wider text-amber-600 uppercase">₦500 Bonus</span>
          </div>
        )}

        {type === "support" && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-3xl">💬</span>
            <span className="text-[10px] font-black tracking-wider text-blue-600 uppercase">24/7 Agent</span>
          </div>
        )}

        {type === "success" && (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-3xl">✨</span>
            <span className="text-[10px] font-black tracking-wider text-emerald-600 uppercase">Verified</span>
          </div>
        )}
      </div>
    </div>
  );
}
