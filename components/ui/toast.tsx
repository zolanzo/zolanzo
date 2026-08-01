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
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full select-none pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-[#0A0F12] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-white animate-slideIn"
        >
          <div className="shrink-0 mt-0.5">
            {t.type === "success" && (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} className="text-emerald-400" />
            )}
            {t.type === "error" && (
              <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-red-400" />
            )}
            {(t.type === "warning" || t.type === "info") && (
              <HugeiconsIcon icon={InformationCircleIcon} size={20} className="text-amber-400" />
            )}
          </div>

          <div className="flex-1 space-y-0.5">
            <p className="text-xs font-bold leading-tight">{t.title}</p>
            {t.description && <p className="text-[11px] text-zinc-400">{t.description}</p>}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-zinc-500 hover:text-white p-1 rounded-lg"
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
