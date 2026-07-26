import type { TextareaHTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import {
  controlClasses,
  errorClasses,
  fieldWrapperClasses,
  hintClasses,
} from "@/components/ui/field-styles";
import { cn } from "@/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function Textarea({
  id,
  label,
  hint,
  error,
  required = false,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;
  const hintId = hint && !error ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = (
    <textarea
      id={textareaId}
      rows={rows}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      className={cn(
        controlClasses({ error: Boolean(error) }),
        "min-h-[6rem] resize-y px-3 py-2.5",
        className,
      )}
      {...props}
    />
  );

  if (!label && !hint && !error) {
    return control;
  }

  return (
    <div className={fieldWrapperClasses()}>
      {label && textareaId ? (
        <Label htmlFor={textareaId} required={required}>
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
