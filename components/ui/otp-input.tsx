"use client";

import {
  useCallback,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Label } from "@/components/ui/label";
import {
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

const OTP_LENGTH = 6;

export type OtpInputProps = {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
};

function sanitizeDigits(input: string): string {
  return input.replace(/\D/g, "");
}

export function OtpInput({
  id,
  value = "",
  onChange,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  autoFocus = false,
  className,
}: OtpInputProps) {
  const fallbackId = useId();
  const groupId = id ?? fallbackId;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = sanitizeDigits(value).slice(0, OTP_LENGTH).split("");
  while (digits.length < OTP_LENGTH) {
    digits.push("");
  }

  const hintId = hint && !error ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const updateValue = useCallback(
    (nextDigits: string[]) => {
      onChange?.(nextDigits.join("").slice(0, OTP_LENGTH));
    },
    [onChange],
  );

  function focusIndex(index: number) {
    const target = inputRefs.current[index];
    target?.focus();
    target?.select();
  }

  function handleDigitChange(index: number, digit: string) {
    const clean = sanitizeDigits(digit);
    const next = [...digits];
    next[index] = clean.slice(-1);
    updateValue(next);
    if (clean && index < OTP_LENGTH - 1) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      updateValue(next);
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = sanitizeDigits(event.clipboardData.getData("text")).slice(
      0,
      OTP_LENGTH,
    );
    if (!pasted) return;
    const next = pasted.split("");
    while (next.length < OTP_LENGTH) {
      next.push("");
    }
    updateValue(next);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  return (
    <div className={fieldWrapperClasses(className)}>
      {label ? (
        <Label htmlFor={`${groupId}-0`} required={required}>
          {label}
        </Label>
      ) : null}
      <div
        role="group"
        aria-label={label ? undefined : "One-time passcode"}
        aria-describedby={describedBy}
        className="flex items-center gap-2"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            id={`${groupId}-${index}`}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && index === 0}
            disabled={disabled}
            value={digit}
            maxLength={1}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={error ? true : undefined}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.currentTarget.select()}
            className={cn(
              "focus-ring h-12 w-10 rounded-lg border bg-surface text-center text-body font-semibold text-foreground shadow-soft transition-colors",
              "hover:border-primary/30",
              error
                ? "border-danger focus-visible:ring-danger"
                : "border-border",
              disabled && "cursor-not-allowed opacity-50",
            )}
          />
        ))}
      </div>
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
  );
}
