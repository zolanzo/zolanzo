"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkCircle01Icon,
  Coins01Icon,
  UserGroupIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { activityService, type ActivityCategory, type ActivityEvent } from "@/lib/activity/service";
import { EmptyState } from "@/components/ui/empty-state";

export default function ActivityPage() {
  const [activities] = useState<ActivityEvent[]>(() => activityService.getActivities());

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case "Application": return CheckmarkCircle01Icon;
      case "Withdrawal": return Coins01Icon;
      case "Referral": return UserGroupIcon;
      case "Achievement": return StarIcon;
      default: return Clock01Icon;
    }
  };

  const getCategoryColor = (category: ActivityCategory) => {
    switch (category) {
      case "Withdrawal": return "text-amber-400 bg-amber-500/10";
      case "Referral": return "text-teal-400 bg-teal-500/10";
      case "Achievement": return "text-purple-400 bg-purple-500/10";
      default: return "text-emerald-400 bg-emerald-500/10";
    }
  };

  const groups = ["Today", "Yesterday", "Earlier This Week", "Earlier"] as const;

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[900px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Activity History
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Platform Audit Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
            Chronological timeline of your earnings, applications, disbursements, and achievements.
          </p>
        </div>

        {/* Timeline Groups */}
        {activities.length === 0 ? (
          <EmptyState
            title="No activity history"
            description="Complete your first opportunity to start generating activity."
          />
        ) : (
          <div className="space-y-8">
            {groups.map((grpName) => {
              const grpItems = activities.filter((a) => a.group === grpName);
              if (grpItems.length === 0) return null;

              return (
                <div key={grpName} className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
                    {grpName}
                  </h3>

                  <div className="space-y-2.5">
                    {grpItems.map((item) => {
                      const Icon = getCategoryIcon(item.category);
                      const colorClass = getCategoryColor(item.category);

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-[#0A0F12] border border-white/10 flex items-start gap-3.5 shadow-sm"
                        >
                          <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center shrink-0 mt-0.5 border border-white/5`}>
                            <HugeiconsIcon icon={Icon} size={18} />
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{item.title}</h4>
                              <span className="text-[10px] text-zinc-500 font-semibold">{item.timestamp}</span>
                            </div>
                            <p className="text-xs text-zinc-400">{item.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
