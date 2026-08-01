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
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 pointer-events-auto transition-all animate-fadeIn text-xs ${
              isSuccess
                ? "bg-emerald-950/90 border-emerald-500/40 text-white"
                : isError
                ? "bg-red-950/90 border-red-500/40 text-white"
                : "bg-zinc-900/90 border-zinc-800 text-white"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              <HugeiconsIcon
                icon={isSuccess ? CheckmarkCircle01Icon : isError ? AlertCircleIcon : InformationCircleIcon}
                size={18}
                className={isSuccess ? "text-emerald-400" : isError ? "text-red-400" : "text-blue-400"}
              />
            </div>

            <div className="flex-1 space-y-0.5">
              <p className="font-bold">{toast.title}</p>
              {toast.description && <p className="text-zinc-300 leading-snug">{toast.description}</p>}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
