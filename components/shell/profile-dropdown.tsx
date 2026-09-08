"use client";

import React from "react";
import Link from "next/link";
import { accountMenuHrefs } from "@/lib/workspace/shell-nav";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Settings01Icon, HelpCircleIcon, Logout01Icon } from "@hugeicons/core-free-icons";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { APP_CONFIG } from "@/config/app";

interface ProfileDropdownProps {
  userName?: string;
  userRole?: string | null;
  onClose: () => void;
}

export function ProfileDropdown({
  userName = "Account",
  userRole = null,
  onClose,
}: ProfileDropdownProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const account = accountMenuHrefs(pathname, userRole);

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
      <Link
        href={account.profile}
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-hover"
      >
        <HugeiconsIcon icon={UserIcon} size={16} className="text-muted-foreground" />
        Profile
      </Link>
      <Link
        href={account.settings}
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
        <SocialBrandIcon platform="WhatsApp" size={16} />
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
