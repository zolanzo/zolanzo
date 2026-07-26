import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type StatProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
};

export function Stat({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: StatProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {icon ? (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-caption text-muted-foreground">{label}</p>
        <p className="text-small font-semibold text-foreground">{value}</p>
        {hint ? (
          <p className="text-caption text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
