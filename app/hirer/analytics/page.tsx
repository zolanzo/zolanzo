"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"Weekly" | "Monthly" | "Yearly">("Monthly");

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Workforce Analytics & Performance
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                Executive Reporting
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Audit campaign spend, completion velocity, worker approval rate, and ROI statistics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(["Weekly", "Monthly", "Yearly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 h-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === p
                    ? "bg-purple-600 border border-purple-500 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => alert("PDF report download started...")}
              className="h-[36px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Spend ({period})</span>
            <span className="text-2xl font-black text-white block">₦1,245,000</span>
            <span className="text-[11px] text-emerald-400 font-bold">↑ 18% vs last period</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Applications Reviewed</span>
            <span className="text-2xl font-black text-purple-400 block">1,820</span>
            <span className="text-[11px] text-purple-400 font-bold">98.2% Approval Rate</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Average Completion Speed</span>
            <span className="text-2xl font-black text-amber-400 block">14.2 Mins</span>
            <span className="text-[11px] text-zinc-400">Fast worker turnaround</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Worker Retention</span>
            <span className="text-2xl font-black text-emerald-400 block">94.6%</span>
            <span className="text-[11px] text-emerald-400 font-bold">Repeat Contributors</span>
          </div>
        </div>

        {/* Visual Progress Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Performing Campaigns</h3>
            
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>AI Model Dataset Image Annotation</span>
                  <span className="text-emerald-400 font-mono">₦722,500</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[85%]" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-white">
                  <span>Mobile Banking Usability & Feedback Survey</span>
                  <span className="text-emerald-400 font-mono">₦252,000</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full w-[42%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Worker Quality Metrics</h3>
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">First-time Pass Rate</span>
                <span className="text-emerald-400 font-bold">96.4%</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Rejections & Disputes</span>
                <span className="text-red-400 font-bold">1.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Average Review Time</span>
                <span className="text-white font-bold">4.2 Hours</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
