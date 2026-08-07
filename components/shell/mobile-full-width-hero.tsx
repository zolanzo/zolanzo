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
    <div className="lg:hidden relative w-full bg-[#0B8F4D] overflow-hidden rounded-b-[24px] shadow-sm mb-4 text-white select-none">
      <div className="px-5 pt-5 pb-5 flex flex-col justify-between min-h-[185px] space-y-4">
        {/* Top Row: Greeting & Notification Bell */}
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-emerald-50 tracking-tight">
            Good Morning, {firstName} 👋
          </span>
          <Link
            href="/notifications"
            className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <HugeiconsIcon icon={Notification01Icon} size={18} />
          </Link>
        </div>

        {/* Second Row: Available Balance */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/80 block">
            {isHirer ? "Escrow Balance" : "Available Balance"}
          </span>
          <div className="text-3xl font-black text-white tracking-tight">
            {availableBalance}
          </div>
        </div>

        {/* Third Row: Pending Review */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-emerald-100/90 font-medium">
              {isHirer ? "Awaiting Review" : "Pending Review"}:
            </span>
            <span className="font-extrabold text-amber-200 bg-amber-900/30 px-2 py-0.5 rounded-full text-[11px]">
              {pendingReview}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
