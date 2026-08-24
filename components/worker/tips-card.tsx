"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export function TipsCard() {
  return (
    <div className="bg-gradient-to-br from-primary-subtle via-card to-muted border border-primary/20 rounded-2xl p-4 sm:p-5 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <HugeiconsIcon icon={InformationCircleIcon} size={18} />
        <span className="text-xs font-bold uppercase tracking-wider">Pro Earning Tip</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
        Complete AI data annotation tasks during morning hours for 25% higher payout rates and faster employer review speeds.
      </p>
    </div>
  );
}
