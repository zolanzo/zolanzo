"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function CompanyProfilePage() {
  const [editing, setEditing] = useState(false);
  const [companyName] = useState("ZOLANZO Campaign Enterprise");
  const [industry] = useState("Technology & Digital Operations");
  const [website] = useState("https://zolanzo.com");
  const [description] = useState("Verified campaign manager enterprise operating high-volume digital workflows and data operations.");

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
        
        {/* Company Card Header */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-emerald-950/60 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-2xl shrink-0 shadow-lg">
              ZOL
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-foreground">{companyName}</h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} /> Verified Hirer Enterprise
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{industry} • Lagos, Nigeria</p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="h-[38px] px-4 rounded-xl border border-border hover:border-emerald-500/40 bg-muted text-foreground text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                  <span>{editing ? "Save Changes" : "Edit Company Profile"}</span>
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed pt-1">{description}</p>
            </div>
          </div>
        </div>

        {/* Verification & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Corporate Credentials</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Website</span>
                <a href={website} target="_blank" rel="noreferrer" className="text-emerald-400 font-bold hover:underline">
                  {website}
                </a>
              </div>

              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Corporate Registration</span>
                <span className="text-foreground font-mono font-bold">RC-881940</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Corporate Email</span>
                <span className="text-foreground font-mono">hiretest@zolanzo.com</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Verification Badges</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="font-bold text-foreground">CAC Corporate Registration</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="font-bold text-foreground">Corporate Bank Account</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="font-bold text-foreground">Tax Identification (TIN)</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
