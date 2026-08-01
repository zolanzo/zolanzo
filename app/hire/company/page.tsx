"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function CompanyProfilePage() {
  const [editing, setEditing] = useState(false);
  const [companyName] = useState("Kora AI Labs Ltd");
  const [industry] = useState("Artificial Intelligence & Data");
  const [website] = useState("https://kora-ai.example.com");
  const [description] = useState("Leading AI dataset collector and model evaluation enterprise operating across Africa.");

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
        
        {/* Company Card Header */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-purple-950/60 border-2 border-purple-500/40 flex items-center justify-center text-purple-400 font-black text-2xl shrink-0 shadow-lg">
              KORA
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white">{companyName}</h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} /> Verified Enterprise
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">{industry} • Lagos, Nigeria</p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="h-[38px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                  <span>{editing ? "Save Changes" : "Edit Company Profile"}</span>
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed pt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* Verification & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Corporate Credentials</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Website</span>
                <a href={website} target="_blank" rel="noreferrer" className="text-purple-400 font-bold hover:underline">
                  {website}
                </a>
              </div>

              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">RC / CAC Registration</span>
                <span className="text-white font-mono font-bold">RC-1928401</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Corporate Email</span>
                <span className="text-white font-mono">admin@kora-ai.example.com</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verification Badges</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-white">CAC Corporate Registration</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-white">Corporate Bank Account</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-white">Tax Identification (TIN)</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
