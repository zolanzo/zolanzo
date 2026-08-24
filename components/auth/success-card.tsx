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
    <div className="space-y-6 py-2 text-center">
      <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border border-primary/20 bg-primary-subtle text-primary shadow-soft sm:h-20 sm:w-20">
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={42} className="animate-bounce text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        <p className="mx-auto max-w-[340px] text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {message}
        </p>
      </div>

      <div className="pt-2">
        {buttonHref ? (
          <Link
            href={buttonHref}
            className="primary-action flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold"
          >
            <span>{buttonLabel}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onButtonClick}
            className="primary-action flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold"
          >
            <span>{buttonLabel}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
