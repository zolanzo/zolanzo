"use client";

import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import {
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

type RadioGroupContextValue = {
  name: string;
  value: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroup(): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioItem must be used within RadioGroup");
  }
  return context;
}

export type RadioGroupProps = {
  name?: string;
  value: string;
  onValueChange?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function RadioGroup({
  name: nameProp,
  value,
  onValueChange,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  children,
  className,
}: RadioGroupProps) {
  const fallbackName = useId();
  const name = nameProp ?? fallbackName;
  const hintId = hint && !error ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <RadioGroupContext.Provider
      value={{ name, value, onValueChange, disabled }}
    >
      <div
        role="radiogroup"
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        className={fieldWrapperClasses(className)}
      >
        {label ? (
          <span className="text-small font-medium text-foreground">
            {label}
            {required ? (
              <span className="ml-0.5 text-danger" aria-hidden>
                *
              </span>
            ) : null}
          </span>
        ) : null}
        <div className="flex flex-col gap-2">{children}</div>
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
    </RadioGroupContext.Provider>
  );
}

export type RadioItemProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "name" | "checked" | "onChange"
> & {
  value: string;
  label: ReactNode;
};

export function RadioItem({
  value,
  label,
  id,
  disabled,
  className,
  ...props
}: RadioItemProps) {
  const group = useRadioGroup();
  const itemId = id ?? `${group.name}-${value}`;
  const isChecked = group.value === value;
  const isDisabled = disabled ?? group.disabled;

  return (
    <label
      htmlFor={itemId}
      className={cn(
        "group inline-flex cursor-pointer items-center gap-3",
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="relative flex shrink-0">
        <input
          type="radio"
          id={itemId}
          name={group.name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={() => group.onValueChange?.(value)}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-full border border-border bg-surface shadow-soft transition-colors",
            "group-hover:border-primary/40",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            isChecked && "border-primary",
          )}
          aria-hidden
        >
          <span
            className={cn(
              "size-2 rounded-full bg-primary transition-transform",
              isChecked ? "scale-100" : "scale-0",
            )}
          />
        </span>
      </span>
      <span className="text-small text-foreground">{label}</span>
    </label>
  );
}
