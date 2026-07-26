import type { HTMLAttributes } from "react";
import { cn } from "@/utils";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: SpinnerSize;
  label?: string;
};

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
};

export function Spinner({
  size = "md",
  label,
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-primary border-r-transparent",
          sizeClasses[size],
        )}
        aria-hidden
      />
      {label ? (
        <span className="text-small text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}
