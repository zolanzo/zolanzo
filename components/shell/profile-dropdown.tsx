"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Settings01Icon, HelpCircleIcon, Logout01Icon } from "@hugeicons/core-free-icons";
import { ThemeModeControl } from "@/components/theme/theme-toggle";
import { APP_CONFIG } from "@/config/app";

interface ProfileDropdownProps {
  userName?: string;
  onClose: () => void;
}

export function ProfileDropdown({ userName = "Account", onClose }: ProfileDropdownProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    onClose();
    router.push("/login");
  };

  return (
    <div
      role="menu"
      className="absolute right-0 z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-elevated p-1.5 shadow-medium"
    >
      <p className="mb-1 truncate border-b border-border px-3 py-2 text-xs font-bold text-foreground">
        {userName}
      </p>
      <div className="mb-1 border-b border-border px-1.5 pb-2 md:hidden">
        <ThemeModeControl variant="menu" />
      </div>
      <Link
        href="/profile"
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-hover"
      >
        <HugeiconsIcon icon={UserIcon} size={16} className="text-muted-foreground" />
        Profile
      </Link>
      <Link
        href="/settings"
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-hover"
      >
        <HugeiconsIcon icon={Settings01Icon} size={16} className="text-muted-foreground" />
        Settings
      </Link>
      <Link
        href="/support"
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-hover"
      >
        <HugeiconsIcon icon={HelpCircleIcon} size={16} className="text-muted-foreground" />
        Support
      </Link>
      <a
        href={APP_CONFIG.supportWhatsApp.href}
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-hover"
      >
        <HugeiconsIcon icon={HelpCircleIcon} size={16} className="text-muted-foreground" />
        WhatsApp Support
      </a>
      <button
        type="button"
        role="menuitem"
        onClick={() => void handleLogout()}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-danger hover:bg-danger/10"
      >
        <HugeiconsIcon icon={Logout01Icon} size={16} />
        Sign out
      </button>
    </div>
  );
}
