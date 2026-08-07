"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search opportunities..." }: SearchBarProps) {
  return (
    <div className="sticky top-16 z-20 bg-[#050608]/90 backdrop-blur-md py-3 mb-4">
      <div className="relative w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          <HugeiconsIcon icon={Search01Icon} size={18} />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[50px] pl-11 pr-10 rounded-2xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white text-sm focus:outline-none transition-all placeholder-zinc-500 shadow-sm"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
