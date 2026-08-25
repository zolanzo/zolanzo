"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { ThemeModeControl } from "@/components/theme/theme-toggle";
import { NotificationDropdown } from "@/components/shell/notification-dropdown";
import { ProfileDropdown } from "@/components/shell/profile-dropdown";
import { UserAvatar } from "@/components/identity/user-avatar";
import { useRealtimeChannel } from "@/lib/realtime/subscriptions";
import { notificationService } from "@/lib/notifications/service";
import { headerWalletHref } from "@/lib/workspace/shell-nav";

interface TopHeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  availableBalance?: string;
  userRole?: string | null;
}

export function TopHeader({
  userName = "Account",
  avatarUrl = null,
  availableBalance,
  userRole = null,
}: TopHeaderProps) {
  const pathname = usePathname();
  const walletHref = headerWalletHref(pathname, userRole);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [balanceLabel, setBalanceLabel] = useState(availableBalance);
  const [unreadCount, setUnreadCount] = useState(() => notificationService.getUnreadCount());
  const menusRef = useRef<HTMLDivElement>(null);

  useRealtimeChannel("wallet", (evt) => {
    if (availableBalance == null) return;
    if (evt.data && typeof evt.data.available === "number") {
      setBalanceLabel(`₦${(evt.data.available as number).toLocaleString()}`);
    }
  });

  useRealtimeChannel("notifications", () => {
    setUnreadCount(notificationService.getUnreadCount());
  });

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (menusRef.current && !menusRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-12 select-none items-center justify-end border-b border-border bg-topbar px-2 text-foreground sm:px-6">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2" ref={menusRef}>
        <ThemeModeControl variant="compact" className="hidden md:block" />
        {walletHref ? (
          balanceLabel ? (
            <Link
              href={walletHref}
              className="focus-ring flex h-9 max-w-[28vw] items-center truncate rounded-xl border border-primary/25 bg-primary-subtle px-2.5 text-xs font-extrabold text-primary hover:bg-primary/15 sm:max-w-[34vw] sm:px-3"
            >
              {balanceLabel}
            </Link>
          ) : (
            <Link
              href={walletHref}
              className="focus-ring flex h-9 items-center rounded-xl border border-border bg-surface px-3 text-xs font-bold text-foreground hover:bg-hover"
            >
              Wallet
            </Link>
          )
        ) : null}

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-hover"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <HugeiconsIcon icon={Notification01Icon} size={18} />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            ) : null}
          </button>
          {notificationsOpen ? (
            <NotificationDropdown onClose={() => setNotificationsOpen(false)} />
          ) : null}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            className="focus-ring flex h-9 items-center gap-2 rounded-xl px-1 hover:bg-hover"
            aria-label="Account menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <UserAvatar
              name={userName}
              src={avatarUrl}
              size={32}
              className="h-8 w-8 rounded-lg border border-border"
            />
            <span className="hidden pr-1 text-xs font-bold text-foreground md:inline-block">
              {userName.split(" ")[0]}
            </span>
          </button>
          {profileOpen ? (
            <ProfileDropdown userName={userName} onClose={() => setProfileOpen(false)} />
          ) : null}
        </div>
      </div>
    </header>
  );
}
