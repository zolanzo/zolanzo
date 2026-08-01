import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  required?: boolean;
};

export function Label({
  children,
  className,
  required = false,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn("text-small font-medium text-foreground", className)}
      {...props}
    >
      {children}
      {required ? (
        <>
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
          <span className="sr-only"> (required)</span>
        </>
      ) : null}
    </label>
  );
}
