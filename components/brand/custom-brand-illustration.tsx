"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CursorPointer01Icon,
  Wallet01Icon,
  UserIcon,
  UserGroupIcon,
  CustomerSupportIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";

const ICONS = {
  tasks: CursorPointer01Icon,
  wallet: Wallet01Icon,
  profile: UserIcon,
  referral: UserGroupIcon,
  support: CustomerSupportIcon,
  success: CheckmarkCircle01Icon,
} as const;

export function CustomBrandIllustration({
  type,
  className = "w-12 h-12",
}: {
  type: "tasks" | "wallet" | "profile" | "referral" | "support" | "success";
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-primary-subtle border border-primary/20 text-primary ${className}`}
      aria-hidden
    >
      <HugeiconsIcon icon={ICONS[type]} size={22} />
    </div>
  );
}
