"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, AlertCircleIcon } from "@hugeicons/core-free-icons";

interface ValidationMessageProps {
  type?: "error" | "info" | "success";
  message: string;
}

export function ValidationMessage({ type = "error", message }: ValidationMessageProps) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 border ${
        isError
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
      }`}
    >
      <HugeiconsIcon
        icon={isError ? AlertCircleIcon : InformationCircleIcon}
        size={16}
        className="shrink-0"
      />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
