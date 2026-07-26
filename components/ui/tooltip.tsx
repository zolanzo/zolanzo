"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/utils";
import { Z_INDEX } from "@/constants/design-tokens";

export type TooltipProps = HTMLAttributes<HTMLDivElement> & {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
};

export function Tooltip({
  content,
  children,
  side = "top",
  className,
  ...props
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 80);
  }, []);

  return (
    <div
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...props}
    >
      <div aria-describedby={open ? id : undefined}>{children}</div>
      {open ? (
        <div
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-[var(--z-tooltip,90)] max-w-xs -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-caption text-foreground shadow-floating",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
          style={{ zIndex: Z_INDEX.tooltip }}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
