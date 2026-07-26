import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils";

export type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  meta?: string;
  icon?: ReactNode;
};

export type TimelineProps = HTMLAttributes<HTMLOListElement> & {
  items: TimelineItem[];
};

export function Timeline({ items, className, ...props }: TimelineProps) {
  return (
    <ol className={cn("relative space-y-0", className)} {...props}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary">
              {item.icon ?? (
                <span className="size-2 rounded-full bg-primary" aria-hidden />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-small font-semibold text-foreground">
                  {item.title}
                </p>
                {item.meta ? (
                  <span className="text-caption text-muted-foreground">
                    {item.meta}
                  </span>
                ) : null}
              </div>
              {item.description ? (
                <p className="mt-1 text-small text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
