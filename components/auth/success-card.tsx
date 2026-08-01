"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

interface SuccessCardProps {
  title: string;
  message: string;
  buttonLabel?: string;
  buttonHref?: string;
  onButtonClick?: () => void;
}

export function SuccessCard({
  title,
  message,
  buttonLabel = "Continue",
  buttonHref,
  onButtonClick,
}: SuccessCardProps) {
  return (
    <div className="text-center space-y-6 py-2">
      {/* Animated Success Illustration / Icon */}
      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={42} className="text-emerald-400 animate-bounce" />
      </div>

      {/* Message Content */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-[340px] mx-auto">
          {message}
        </p>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        {buttonHref ? (
          <Link
            href={buttonHref}
            className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[2px] flex items-center justify-center gap-2"
          >
            <span>{buttonLabel}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onButtonClick}
            className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[2px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{buttonLabel}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
