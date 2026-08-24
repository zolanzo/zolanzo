"use client";

import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, InformationCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 flex max-w-sm flex-col gap-2.5 select-none pointer-events-none sm:inset-x-auto sm:right-6 lg:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-elevated p-4 text-foreground shadow-dialog animate-slideIn"
        >
          <div className="shrink-0 mt-0.5">
            {t.type === "success" && (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} className="text-success" />
            )}
            {t.type === "error" && (
              <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-danger" />
            )}
            {(t.type === "warning" || t.type === "info") && (
              <HugeiconsIcon icon={InformationCircleIcon} size={20} className="text-warning" />
            )}
          </div>

          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-bold leading-tight">{t.title}</p>
            {t.description && <p className="text-[11px] text-muted-foreground">{t.description}</p>}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  return { toasts, addToast, removeToast };
}
