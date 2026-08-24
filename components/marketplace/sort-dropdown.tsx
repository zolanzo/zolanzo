"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sorting01Icon } from "@hugeicons/core-free-icons";

export type SortOption = "Newest" | "Highest Paying" | "Ending Soon" | "Shortest Duration" | "Recommended";

interface SortDropdownProps {
  value: SortOption;
  onChange: (val: SortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const options: SortOption[] = [
    "Recommended",
    "Newest",
    "Highest Paying",
    "Ending Soon",
    "Shortest Duration",
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground hidden sm:inline-block">Sort by:</span>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <HugeiconsIcon icon={Sorting01Icon} size={14} />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="h-[38px] pl-8 pr-4 rounded-xl bg-card border border-border text-foreground text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
