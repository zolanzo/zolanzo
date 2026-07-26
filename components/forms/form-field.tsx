import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Label } from "@/components/ui/label";
import { errorClasses, fieldWrapperClasses, hintClasses } from "@/components/ui/field-styles";
import { cn } from "@/utils";

type FieldChildProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export type FormFieldProps = {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * Thin field wrapper — label, control slot, hint/error messaging.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [hint && !error ? hintId : undefined, errorId].filter(Boolean).join(" ") ||
    undefined;

  const child = Children.only(children);
  const control =
    isValidElement(child) && typeof child.type !== "string"
      ? cloneElement(child as ReactElement<FieldChildProps>, {
          id,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        })
      : child;

  return (
    <div className={fieldWrapperClasses(className)}>
      {label ? (
        <Label htmlFor={id} required={required}>
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
        <p id={errorId} className={cn(errorClasses())} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
