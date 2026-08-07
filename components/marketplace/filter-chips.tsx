"use client";

import React from "react";

export type FilterCategory =
  | "All"
  | "Recommended"
  | "AI"
  | "Social Media"
  | "Research"
  | "Writing"
  | "Customer Support"
  | "Data Entry"
  | "Virtual Assistant"
  | "Business"
  | "Quick Tasks"
  | "High Paying"
  | "Newest"
  | "Verified";

interface FilterChipsProps {
  selectedCategory: FilterCategory;
  onSelect: (category: FilterCategory) => void;
}

export function FilterChips({ selectedCategory, onSelect }: FilterChipsProps) {
  const categories: FilterCategory[] = [
    "All",
    "Recommended",
    "AI",
    "Social Media",
    "Research",
    "Writing",
    "Customer Support",
    "Data Entry",
    "Virtual Assistant",
    "Business",
    "Quick Tasks",
    "High Paying",
    "Newest",
    "Verified",
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1 mb-6 flex items-center gap-2 select-none">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={`h-[38px] px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border ${
              isSelected
                ? "bg-[#008744]/20 border-[#008744] text-white ring-1 ring-[#008744]/40"
                : "bg-[#0D1218] border-white/[0.08] text-zinc-400 hover:border-emerald-500/40 hover:text-white"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
