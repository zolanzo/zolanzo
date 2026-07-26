import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import {
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: ReactNode;
  hint?: string;
  error?: string;
};

export function Checkbox({
  id,
  label,
  hint,
  error,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? props.name;
  const hintId = hint && !error ? `${checkboxId}-hint` : undefined;
  const errorId = error ? `${checkboxId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={fieldWrapperClasses(className)}>
      <label
        className={cn(
          "group inline-flex cursor-pointer items-start gap-3",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="relative mt-0.5 flex shrink-0">
          <input
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-md border border-border bg-surface shadow-soft transition-colors",
              "group-hover:border-primary/40",
              "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
              "peer-checked:border-primary peer-checked:bg-primary",
              error && "border-danger peer-focus-visible:ring-danger",
            )}
            aria-hidden
          >
            <Check className="size-3 text-primary-foreground opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
          </span>
        </span>
        {label || hint || error ? (
          <span className="flex flex-col gap-1">
            {label ? (
              <span className="text-small text-foreground">{label}</span>
            ) : null}
            {hint && !error ? (
              <span id={hintId} className={hintClasses()}>
                {hint}
              </span>
            ) : null}
            {error ? (
              <span id={errorId} className={errorClasses()} role="alert">
                {error}
              </span>
            ) : null}
          </span>
        ) : null}
      </label>
    </div>
  );
}
