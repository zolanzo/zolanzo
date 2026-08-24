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
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(digitsOnly);
  };

  return (
    <div className="w-full space-y-1.5 text-left">
      <div>
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </label>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          <HugeiconsIcon icon={CircleLock01Icon} size={18} />
        </div>

        <input
          id={id}
          name={id}
          autoComplete="current-password"
          type={showPin ? "text" : "password"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`h-[48px] w-full rounded-xl border bg-input-background pl-10 pr-11 font-mono text-base tracking-[0.2em] text-foreground transition-all duration-200 focus:outline-none ${
            error
              ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger"
              : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
          aria-label={showPin ? "Hide PIN" : "Show PIN"}
        >
          <HugeiconsIcon icon={showPin ? ViewOffIcon : ViewIcon} size={18} />
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
