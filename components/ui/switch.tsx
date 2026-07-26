"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

export type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "role" | "type" | "onChange"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function Switch({
  id,
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  hint,
  error,
  required = false,
  disabled,
  className,
  onClick,
  ...props
}: SwitchProps) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isOn = isControlled ? checked : internalChecked;

  const switchId = id;
  const hintId = hint && !error ? `${switchId}-hint` : undefined;
  const errorId = error ? `${switchId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    onClick?.(event);
    if (event.defaultPrevented) return;
    const next = !isOn;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onCheckedChange?.(next);
  }

  const toggle = (
    <button
      type="button"
      id={switchId}
      role="switch"
      aria-checked={isOn}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "focus-ring relative inline-flex h-6 w-11 shrink-0 rounded-pill border transition-colors",
        isOn ? "border-primary bg-primary" : "border-border bg-surface",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 block size-[1.125rem] rounded-full bg-white shadow-soft transition-transform",
          isOn ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
        aria-hidden
      />
    </button>
  );

  if (!label && !hint && !error) {
    return toggle;
  }

  return (
    <div className={fieldWrapperClasses()}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {label && switchId ? (
            <Label htmlFor={switchId} required={required}>
              {label}
            </Label>
          ) : label ? (
            <span className="text-small font-medium text-foreground">
              {label}
            </span>
          ) : null}
          {hint && !error ? (
            <p id={hintId} className={hintClasses()}>
              {hint}
            </p>
          ) : null}
          {error ? (
            <p id={errorId} className={errorClasses()} role="alert">
              {error}
            </p>
          ) : null}
        </div>
        {toggle}
      </div>
    </div>
  );
}
