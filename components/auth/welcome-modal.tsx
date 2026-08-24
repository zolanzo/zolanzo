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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[400px] max-h-[min(90dvh,40rem)] overflow-y-auto rounded-3xl border border-border bg-elevated p-6 text-center text-foreground shadow-dialog">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle text-primary">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} />
        </div>

        <h3 className="mb-2 text-2xl font-bold tracking-tight">
          {role === "worker"
            ? "Welcome! You're ready to start earning."
            : "Welcome! You're ready to launch your first campaign."}
        </h3>

        <p className="mb-6 text-xs leading-relaxed text-muted-foreground">
          {role === "worker"
            ? "Explore available tasks, complete assignments, and receive instant payouts to your bank account."
            : "Post jobs, define budgets in escrow, and recruit verified digital talent across Africa."}
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="primary-action flex h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-xs font-bold"
        >
          <span>Get Started</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </button>
      </div>
    </div>
  );
}
