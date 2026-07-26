import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-h3 text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-small text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
