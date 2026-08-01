"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

interface WelcomeModalProps {
  role?: "worker" | "employer";
}

export function WelcomeModal({ role = "worker" }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("zolanzo_welcome_seen");
    }
    return false;
  });

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("zolanzo_welcome_seen", "true");
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[400px] bg-[#0A0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center text-white">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} />
        </div>

        <h3 className="text-2xl font-bold tracking-tight mb-2">
          {role === "worker"
            ? "Welcome! You're ready to start earning."
            : "Welcome! You're ready to launch your first campaign."}
        </h3>

        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          {role === "worker"
            ? "Explore available tasks, complete assignments, and receive instant payouts to your bank account."
            : "Post jobs, define budgets in escrow, and recruit verified digital talent across Africa."}
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <span>Get Started</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>
      </div>
    </div>
  );
}
