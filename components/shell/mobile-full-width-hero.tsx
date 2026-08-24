"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";

interface MobileFullWidthHeroProps {
  firstName: string;
  availableBalance: string;
  pendingReview: string;
  isHirer?: boolean;
}

export function MobileFullWidthHero({
  firstName,
  availableBalance,
  pendingReview,
  isHirer = false,
}: MobileFullWidthHeroProps) {
  return (
    <div className="lg:hidden relative w-full bg-primary overflow-hidden rounded-b-[24px] shadow-sm mb-4 text-primary-foreground select-none">
      <div className="px-5 pt-5 pb-5 flex flex-col justify-between min-h-[185px] space-y-4">
        {/* Top Row: Greeting & Notification Bell */}
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-primary-foreground/90 tracking-tight">
            Good Morning, {firstName} 👋
          </span>
          <Link
            href="/notifications"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-primary-foreground transition-colors hover:bg-white/25"
            aria-label="Notifications"
          >
            <HugeiconsIcon icon={Notification01Icon} size={18} />
          </Link>
        </div>

        {/* Second Row: Available Balance */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70 block">
            {isHirer ? "Escrow Balance" : "Available Balance"}
          </span>
          <div className="text-3xl font-black text-primary-foreground tracking-tight">
            {availableBalance}
          </div>
        </div>

        {/* Third Row: Pending Review */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-primary-foreground/85 font-medium">
              {isHirer ? "Awaiting Review" : "Pending Review"}:
            </span>
            <span className="font-extrabold text-warning-foreground bg-warning/90 px-2 py-0.5 rounded-full text-[11px]">
              {pendingReview}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
