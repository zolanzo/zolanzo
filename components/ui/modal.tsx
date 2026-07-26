"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/utils";
import { MOTION, Z_INDEX } from "@/constants/design-tokens";
import { IconButton } from "@/components/ui/icon-button";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  showClose?: boolean;
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  showClose = true,
  className,
}: ModalProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    if (focusables.length === 0) return;

    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      trapFocus(event);
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open, trapFocus]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: Z_INDEX.modal }}
          role="presentation"
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-overlay"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: MOTION.fast }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: MOTION.base }}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-foreground shadow-dialog",
              className,
            )}
          >
            {(title || showClose) && (
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  {title ? (
                    <h2 id="modal-title" className="text-h3">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p
                      id="modal-description"
                      className="mt-1 text-small text-muted-foreground"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
                {showClose ? (
                  <IconButton label="Close dialog" size="sm" onClick={onClose}>
                    <X className="size-4" aria-hidden />
                  </IconButton>
                ) : null}
              </div>
            )}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
