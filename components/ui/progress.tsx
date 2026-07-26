import type { HTMLAttributes } from "react";
import { cn } from "@/utils";

export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.min(max, Math.max(0, value));
  const percent = max > 0 ? Math.round((clamped / max) * 100) : 0;

  return (
    <div className={cn("w-full", className)} {...props}>
      {label || showValue ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          {label ? (
            <span className="text-small text-muted-foreground">{label}</span>
          ) : (
            <span />
          )}
          {showValue ? (
            <span className="text-caption font-medium text-foreground">
              {percent}%
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-pill bg-surface"
      >
        <div
          className="h-full rounded-pill bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
