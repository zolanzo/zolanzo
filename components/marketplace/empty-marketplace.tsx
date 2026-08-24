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
    <div className="my-6 flex w-full flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-card p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle text-primary">
        <HugeiconsIcon icon={Search01Icon} size={28} />
      </div>

      <div className="max-w-sm space-y-1">
        <h3 className="text-lg font-bold text-foreground">No tasks found</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {searchQuery
            ? `No opportunities matched "${searchQuery}". Try adjusting your filters or search terms.`
            : "No opportunities match the selected category filters at this moment."}
        </p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="h-[42px] cursor-pointer rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover"
      >
        Clear All Filters
      </button>
    </div>
  );
}
