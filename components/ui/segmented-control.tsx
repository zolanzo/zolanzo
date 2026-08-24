"use client";

import React from "react";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div className={`flex space-x-1 rounded-xl border border-border bg-muted p-1 ${className}`}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex h-[38px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all duration-200 ${
              isSelected
                ? "border border-primary/40 bg-primary-subtle text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-hover hover:text-foreground"
            }`}
          >
            <span>{opt.label}</span>
            {opt.badge && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] text-primary">{opt.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
