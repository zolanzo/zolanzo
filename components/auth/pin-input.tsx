"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon, CircleLock01Icon } from "@hugeicons/core-free-icons";

interface PINInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function PINInput({
  id,
  label,
  value,
  onChange,
  placeholder = "",
  error,
  required = true,
}: PINInputProps) {
  const [showPin, setShowPin] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numbers, max 6 digits
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(digitsOnly);
  };

  return (
    <div className="space-y-1.5 w-full text-left">
      <div>
        <label htmlFor={id} className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
          {label}
        </label>
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400 pointer-events-none">
          <HugeiconsIcon icon={CircleLock01Icon} size={18} />
        </div>

        <input
          id={id}
          name={id}
          type={showPin ? "text" : "password"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`w-full h-[48px] pl-10 pr-12 rounded-xl bg-slate-100 dark:bg-[#181F29] border text-slate-900 dark:text-white text-base tracking-[0.2em] font-mono focus:outline-none transition-all duration-200 ${
            error
              ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-slate-300 dark:border-white/[0.08] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1 rounded-lg focus:outline-none cursor-pointer"
          aria-label={showPin ? "Hide PIN" : "Show PIN"}
        >
          <HugeiconsIcon icon={showPin ? ViewOffIcon : ViewIcon} size={18} />
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-400 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
