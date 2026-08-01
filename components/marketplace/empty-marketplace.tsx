"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

interface EmptyMarketplaceProps {
  searchQuery?: string;
  onReset: () => void;
}

export function EmptyMarketplace({ searchQuery, onReset }: EmptyMarketplaceProps) {
  return (
    <div className="w-full bg-[#0A0F12] border border-white/10 rounded-2xl p-10 text-center space-y-4 flex flex-col items-center justify-center my-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <HugeiconsIcon icon={Search01Icon} size={28} />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-lg font-bold text-white">No tasks found</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {searchQuery
            ? `No opportunities matched "${searchQuery}". Try adjusting your filters or search terms.`
            : "No opportunities match the selected category filters at this moment."}
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="h-[42px] px-5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
      >
        Clear All Filters
      </button>
    </div>
  );
}
