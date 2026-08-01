"use client";

import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`w-full bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl relative overflow-hidden ${className}`}
    >
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      {children}
    </div>
  );
}
