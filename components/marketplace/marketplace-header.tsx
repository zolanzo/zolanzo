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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Opportunities
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            Live Earnings
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
          Discover verified digital opportunities, complete work, and receive instant bank payouts.
        </p>
      </div>

      {onToggleFilters && (
        <button
          type="button"
          onClick={onToggleFilters}
          className="h-[44px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Sorting01Icon} size={16} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#008744] text-white text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
