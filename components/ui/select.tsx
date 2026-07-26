import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import {
  controlClasses,
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  children?: ReactNode;
};

export function Select({
  id,
  label,
  hint,
  error,
  required = false,
  placeholder,
  options,
  children,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  const hintId = hint && !error ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = (
    <div className="relative">
      <select
        id={selectId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={cn(
          controlClasses({ error: Boolean(error), className: "h-10" }),
          "appearance-none pr-10",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options
          ? options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );

  if (!label && !hint && !error) {
    return control;
  }

  return (
    <div className={fieldWrapperClasses()}>
      {label && selectId ? (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      ) : null}
      {control}
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
