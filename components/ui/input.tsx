import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Label } from "@/components/ui/label";
import {
  controlClasses,
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightSlot?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    required = false,
    leftIcon,
    rightIcon,
    rightSlot,
    className,
    disabled,
    ...props
  },
  ref,
) {
  const inputId = id ?? props.name;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const hasAffixes = Boolean(leftIcon || rightIcon || rightSlot);

  const input = (
    <input
      ref={ref}
      id={inputId}
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      className={cn(
        controlClasses({ error: Boolean(error), className: "h-10" }),
        leftIcon ? "pl-10" : undefined,
        rightIcon || rightSlot ? "pr-10" : undefined,
        className,
      )}
      {...props}
    />
  );

  const control = hasAffixes ? (
    <div className="relative">
      {leftIcon ? (
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4"
          aria-hidden
        >
          {leftIcon}
        </span>
      ) : null}
      {input}
      {rightSlot ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {rightSlot}
        </span>
      ) : null}
      {rightIcon && !rightSlot ? (
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4"
          aria-hidden
        >
          {rightIcon}
        </span>
      ) : null}
    </div>
  ) : (
    input
  );

  if (!label && !hint && !error) {
    return control;
  }

  return (
    <div className={fieldWrapperClasses()}>
      {label && inputId ? (
        <Label htmlFor={inputId} required={required}>
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
});
