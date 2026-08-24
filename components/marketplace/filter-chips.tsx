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
                ? "border-primary bg-primary/20 text-foreground ring-1 ring-primary/40"
                : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
