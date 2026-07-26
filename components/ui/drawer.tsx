"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/utils";
import { MOTION, Z_INDEX } from "@/constants/design-tokens";
import { IconButton } from "@/components/ui/icon-button";

export type DrawerSide = "left" | "right";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: DrawerSide;
  title?: string;
  showClose?: boolean;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  children,
  side = "right",
  title,
  showClose = true,
  className,
}: DrawerProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, open]);

  const slideFrom = side === "left" ? { x: "-100%" } : { x: "100%" };

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0"
          style={{ zIndex: Z_INDEX.modal }}
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close drawer"
            className="absolute inset-0 bg-overlay"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: MOTION.fast }}
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? false : slideFrom}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : slideFrom}
            transition={{ duration: MOTION.base }}
            className={cn(
              "absolute top-0 flex h-full w-full max-w-sm flex-col border-border bg-card text-foreground shadow-dialog outline-none",
              side === "left" ? "left-0 border-r" : "right-0 border-l",
              className,
            )}
          >
            {(title || showClose) && (
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                {title ? <h2 className="text-h3">{title}</h2> : <span />}
                {showClose ? (
                  <IconButton label="Close drawer" size="sm" onClick={onClose}>
                    <X className="size-4" aria-hidden />
                  </IconButton>
                ) : null}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
