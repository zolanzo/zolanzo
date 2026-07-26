import type { HTMLAttributes } from "react";
import { cn } from "@/utils";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: DividerOrientation;
  label?: string;
};

export function Divider({
  orientation = "horizontal",
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("w-px self-stretch bg-border", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="text-caption text-muted-foreground">{label}</span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("h-px w-full bg-border", className)}
      {...props}
    />
  );
}
