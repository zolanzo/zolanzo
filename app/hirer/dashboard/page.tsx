"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  CircleLock01Icon,
  CursorPointer01Icon,
  ClipboardListIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { MobileFullWidthHero } from "@/components/shell/mobile-full-width-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { zolanzoEngine } from "@/lib/engine/business-engine";
import { useRealtimeChannel } from "@/lib/realtime/subscriptions";

export default function HirerDashboardPage() {
  const [empBalance, setEmpBalance] = useState({ available: 0, escrow: 0, pending: 0 });

  React.useEffect(() => {
    let isMounted = true;
    zolanzoEngine.getWalletBalance("EMPLOYER_100").then((bal) => {
      if (isMounted) setEmpBalance(bal);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useRealtimeChannel("wallet", async () => {
    const updated = await zolanzoEngine.getWalletBalance("EMPLOYER_100");
    setEmpBalance(updated);
  });

  const metrics = [
    { label: "Available Balance", value: `₦${empBalance.available.toLocaleString()}`, sub: "Ready for Campaign Escrow", icon: Wallet01Icon, color: "text-[#111111]" },
    { label: "Escrow Balance", value: `₦${empBalance.escrow.toLocaleString()}`, sub: "Protected & Locked", icon: CircleLock01Icon, color: "text-[#0B8F4D]" },
    { label: "Active Opportunities", value: "0 Active", sub: "Currently Hiring", icon: CursorPointer01Icon, color: "text-[#0B8F4D]" },
    { label: "Awaiting Review", value: "0 Pending", sub: "Action Required Today", icon: ClipboardListIcon, color: "text-amber-600" },
  ];

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      {/* FULL-WIDTH SOLID EMERALD HERO HEADER FOR HIRER */}
      <MobileFullWidthHero
        firstName="Campaign Manager"
        availableBalance={`₦${empBalance.escrow.toLocaleString()}`}
        pendingReview="0 Pending"
        isHirer={true}
      />

      <div className="max-w-[1440px] mx-auto space-y-6 px-4 sm:px-0 pb-20">
        
        {/* DESKTOP-ONLY HEADER & ACTIONS BAR */}
        <div className="hidden lg:flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Hirer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed mt-1">
              Create campaign opportunities, lock escrow funding, inspect earner submissions, and monitor workforce performance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/hirer/opportunities/new"
              className="h-[42px] px-5 rounded-xl bg-[#0B8F4D] hover:bg-[#097A42] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              <span>Create Opportunity</span>
            </Link>

            <Link
              href="/hirer/wallet"
              className="h-[42px] px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#111111] font-bold text-xs flex items-center justify-center gap-2 transition-colors border-emerald-600/30 text-[#0B8F4D]"
            >
              <HugeiconsIcon icon={Wallet01Icon} size={16} />
              <span>Fund Wallet</span>
            </Link>
          </div>
        </div>

        {/* 4 Standardized Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-[#0B8F4D]/40 transition-colors flex flex-col justify-between min-h-[120px] shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#666666] uppercase tracking-wider">{m.label}</span>
                <div className="w-8 h-8 rounded-xl bg-[#E6F4ED] text-[#0B8F4D] flex items-center justify-center">
                  <HugeiconsIcon icon={m.icon} size={16} />
                </div>
              </div>
              <div className="space-y-0.5 pt-2">
                <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                <div className="text-[11px] text-[#666666]">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Section: Active Campaigns */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
              Active Campaigns
            </h2>
            <Link
              href="/hirer/opportunities"
              className="text-xs font-bold text-[#0B8F4D] hover:underline"
            >
              Manage All
            </Link>
          </div>

          <EmptyState
            title="No Active Campaign Opportunities"
            description="Create your first campaign opportunity to start recruiting verified African earners."
            actionLabel="Create Opportunity"
            actionHref="/hirer/opportunities/new"
          />
        </div>
      </div>
    </AppShell>
  );
}
