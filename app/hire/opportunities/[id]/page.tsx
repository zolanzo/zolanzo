"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CircleLock01Icon,
  PauseIcon,
  PlayIcon,
  CheckmarkCircle01Icon,
  UserCheck01Icon,
  ClipboardListIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HireOpportunityDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [status, setStatus] = useState<"Live" | "Paused">("Live");
  const [activeTab, setActiveTab] = useState<"Overview" | "Applicants" | "Submissions" | "Payments">("Overview");

  const toggleStatus = () => {
    setStatus((prev) => (prev === "Live" ? "Paused" : "Live"));
  };

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Navigation */}
        <Link
          href="/hire/opportunities"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back to My Opportunities
        </Link>

        {/* Opportunity Header Banner */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                status === "Live" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {status} Campaign
              </span>
              <span className="text-xs text-zinc-400">ID: {resolvedParams.id} • AI Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">AI Model Image Dataset Annotation</h1>
            <p className="text-xs text-zinc-400">Published by Kora AI Labs • Target: 1,000 Verified Workers</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleStatus}
              className="h-[44px] px-5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={status === "Live" ? PauseIcon : PlayIcon} size={16} />
              <span>{status === "Live" ? "Pause Campaign" : "Resume Campaign"}</span>
            </button>

            <Link
              href="/hire/applications"
              className="h-[44px] px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <HugeiconsIcon icon={ClipboardListIcon} size={16} />
              <span>Review Applicants (24)</span>
            </Link>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Specs & Tabs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab Controls */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
              {(["Overview", "Applicants", "Submissions", "Payments"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? "bg-purple-600/20 border border-purple-500 text-white"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Content */}
            {activeTab === "Overview" && (
              <div className="space-y-6">
                <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Campaign Overview</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Identify and label objects within high-resolution street view images. Annotate bounding boxes for vehicles, pedestrians, and traffic signs accurately.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Reward / Slot</span>
                      <span className="text-emerald-400 font-bold font-mono text-base">₦850</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Slots Progress</span>
                      <span className="text-white font-bold text-base">850 / 1,000</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Est. Duration</span>
                      <span className="text-white font-bold text-base">15 mins</span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Verification Requirements</h3>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400" />
                      <span>Must have Phone & Email Verified</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400" />
                      <span>Minimum 95% Earner Approval Rate</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Applicants Tab */}
            {activeTab === "Applicants" && (
              <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 text-center space-y-4">
                <p className="text-xs text-zinc-400">24 Pending Applications awaiting your review.</p>
                <Link
                  href="/hire/applications"
                  className="inline-flex h-[40px] px-6 rounded-xl bg-purple-600 text-white font-bold text-xs items-center justify-center"
                >
                  Open Application Review Queue →
                </Link>
              </div>
            )}

          </div>

          {/* Right Escrow & Budget Sidebar */}
          <div className="space-y-4">
            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HugeiconsIcon icon={CircleLock01Icon} size={16} className="text-purple-400" />
                Escrow & Budget Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Total Campaign Budget</span>
                  <span className="text-white font-mono font-bold">₦850,000</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Total Funds Disbursed</span>
                  <span className="text-emerald-400 font-mono font-bold">₦722,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Locked Escrow Remaining</span>
                  <span className="text-purple-400 font-mono font-bold">₦127,500</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <HugeiconsIcon icon={UserCheck01Icon} size={16} />
                <span>850 Workers Paid</span>
              </div>
              <p className="text-[11px] text-zinc-400">Average review approval time: 4.2 hours.</p>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
