"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { type ToastItem } from "@/components/ui/use-toast";

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 max-w-sm space-y-2 pointer-events-none select-none sm:inset-x-auto sm:right-6 lg:bottom-6">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`flex pointer-events-auto items-start gap-3 rounded-2xl border p-4 text-xs shadow-dialog backdrop-blur-md transition-all animate-fadeIn ${
              isSuccess
                ? "border-success/40 bg-success/15 text-foreground"
                : isError
                  ? "border-danger/40 bg-danger/15 text-foreground"
                  : "border-border bg-elevated text-foreground"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <HugeiconsIcon
                icon={isSuccess ? CheckmarkCircle01Icon : isError ? AlertCircleIcon : InformationCircleIcon}
                size={18}
                className={isSuccess ? "text-success" : isError ? "text-danger" : "text-info"}
              />
            </div>

            <div className="flex-1 space-y-0.5">
              <p className="font-bold">{toast.title}</p>
              {toast.description && <p className="leading-snug text-muted-foreground">{toast.description}</p>}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
