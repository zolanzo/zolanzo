"use client";

import React, { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface DrawerProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "right" | "left";
}

export function Drawer({
  isOpen,
  open,
  onClose,
  title,
  children,
  side = "right",
}: DrawerProps) {
  const isVisible = open ?? isOpen ?? false;
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isVisible) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const sideStyle = side === "right" ? "right-0" : "left-0";

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn bg-overlay backdrop-blur-sm">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed bottom-0 top-0 ${sideStyle} z-50 flex w-full max-w-md animate-slideIn flex-col justify-between border-l border-border bg-card p-6 text-foreground shadow-dialog`}
      >
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close drawer"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
