"use client";

import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`surface-panel-lg w-full overflow-hidden p-6 backdrop-blur-2xl sm:p-8 ${className}`}
    >
      {/* Top subtle highlight line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      {children}
    </div>
  );
}
