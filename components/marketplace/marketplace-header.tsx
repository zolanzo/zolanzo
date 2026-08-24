"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sorting01Icon } from "@hugeicons/core-free-icons";

interface MarketplaceHeaderProps {
  onToggleFilters?: () => void;
  activeFilterCount?: number;
}

export function MarketplaceHeader({ onToggleFilters, activeFilterCount = 0 }: MarketplaceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Opportunities
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-subtle text-primary text-[10px] font-bold border border-primary/20">
            Live Earnings
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
          Discover verified digital opportunities, complete work, and receive instant bank payouts.
        </p>
      </div>

      {onToggleFilters && (
        <button
          type="button"
          onClick={onToggleFilters}
          className="h-[44px] px-4 rounded-xl border border-border hover:border-border-strong bg-card text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Sorting01Icon} size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
