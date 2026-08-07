"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CheckmarkBadge01Icon,
  StarIcon,
  Mail01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/ui/empty-state";

interface EarnerTalent {
  id: string;
  name: string;
  avatar: string;
  country: string;
  approvalRate: string;
  completedTasks: number;
  rating: string;
  skills: string[];
  languages: string[];
  verified: boolean;
}

export default function EarnersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const earners: EarnerTalent[] = [];

  const filteredEarners = earners.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Verified Earners Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                1,420 Active Contributors
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
              Discover top-rated digital earners by skill, approval rating, language, and verified identity.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search earners by name or skill..."
            className="w-full h-[44px] pl-10 pr-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-xs text-foreground focus:outline-none"
          />
        </div>

        {/* Earners Grid */}
        {filteredEarners.length === 0 ? (
          <EmptyState
            icon={UserGroupIcon}
            title="No Verified Earners Found"
            description="There are currently no active earner profiles matching your search criteria. Check back soon or refine your search parameters."
            actionLabel="Clear Search Filter"
            onAction={() => setSearchQuery("")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEarners.map((e) => (
              <div
                key={e.id}
                className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <Image
                        src={e.avatar}
                        alt={e.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-card">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-foreground">{e.name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{e.country} • {e.languages.join(", ")}</p>
                      <div className="flex items-center gap-1.5 text-xs pt-1">
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          <HugeiconsIcon icon={StarIcon} size={12} /> {e.rating}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-emerald-400 font-bold">{e.approvalRate} Approval Rate</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completed Opportunities</span>
                    <span className="text-foreground font-bold">{e.completedTasks} Submissions</span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {e.skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-muted/40 border border-border text-[11px] font-bold text-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => alert(`Invitation sent to ${e.name}!`)}
                    className="w-full h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <HugeiconsIcon icon={Mail01Icon} size={16} />
                    <span>Invite to Opportunity</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
