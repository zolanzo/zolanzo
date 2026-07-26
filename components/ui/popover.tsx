"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/utils";
import { Z_INDEX } from "@/constants/design-tokens";

export type PopoverProps = HTMLAttributes<HTMLDivElement> & {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
};

export function Popover({
  trigger,
  children,
  align = "start",
  className,
  ...props
}: PopoverProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [close, open]);

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  } as const;

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)} {...props}>
      <div
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
      >
        {trigger}
      </div>
      {open ? (
        <div
          id={id}
          role="dialog"
          className={cn(
            "absolute top-full z-[var(--z-dropdown,50)] mt-2 min-w-48 rounded-xl border border-border bg-card p-3 text-foreground shadow-floating",
            alignClasses[align],
          )}
          style={{ zIndex: Z_INDEX.dropdown }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
