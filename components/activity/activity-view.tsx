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
import { activityService, type ActivityCategory, type ActivityEvent } from "@/lib/activity/service";
import { EmptyState } from "@/components/ui/empty-state";

export function ActivityView() {
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
      case "Withdrawal": return "text-warning bg-warning/10";
      case "Referral": return "text-accent bg-accent-subtle";
      case "Achievement": return "text-warning bg-warning/10";
      default: return "text-primary bg-primary-subtle";
    }
  };

  const groups = ["Today", "Yesterday", "Earlier This Week", "Earlier"] as const;

  return (
    <div className="max-w-3xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
      <h1 className="text-lg font-black text-foreground">Activity</h1>

      {activities.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Completed work and payouts will appear here."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((grpName) => {
            const grpItems = activities.filter((a) => a.group === grpName);
            if (grpItems.length === 0) return null;

            return (
              <div key={grpName} className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {grpName}
                </h3>

                <div className="space-y-2">
                  {grpItems.map((item) => {
                    const Icon = getCategoryIcon(item.category);
                    const colorClass = getCategoryColor(item.category);

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-card border border-border flex items-start gap-3"
                      >
                        <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center shrink-0`}>
                          <HugeiconsIcon icon={Icon} size={18} />
                        </div>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-foreground leading-snug">{item.title}</h4>
                            <span className="text-[10px] text-muted-foreground font-semibold">{item.timestamp}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
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
  );
}
