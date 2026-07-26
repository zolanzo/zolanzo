import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/utils";
import { Card } from "@/components/ui/card";

export type MetricCardProps = {
  label: string;
  value: ReactNode;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function MetricCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  className,
}: MetricCardProps) {
  const positive = delta !== undefined && delta >= 0;

  return (
    <Card className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-small text-muted-foreground">{label}</p>
        {icon ? (
          <div className="border-border bg-surface text-primary flex size-10 shrink-0 items-center justify-center rounded-xl border">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-h2 text-foreground font-bold tracking-tight">
          {value}
        </p>
        {delta !== undefined ? (
          <div
            className={cn(
              "text-caption inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium",
              positive
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger",
            )}
          >
            {positive ? (
              <TrendingUp className="size-3.5" aria-hidden />
            ) : (
              <TrendingDown className="size-3.5" aria-hidden />
            )}
            <span>
              {positive ? "+" : ""}
              {delta}%
            </span>
            {deltaLabel ? (
              <span className="text-muted-foreground">{deltaLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
