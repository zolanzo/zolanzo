"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { NotificationDropdown } from "@/components/shell/notification-dropdown";
import { ProfileDropdown } from "@/components/shell/profile-dropdown";
import { GlobalSearchModal } from "@/components/shell/global-search-modal";
import { useRealtimeChannel } from "@/lib/realtime/subscriptions";
import { notificationService } from "@/lib/notifications/service";

interface TopHeaderProps {
  userName?: string;
  avatarUrl?: string;
}

export function TopHeader({ userName = "ZOLANZO Member", avatarUrl = "/brand/lady1.png" }: TopHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [availableBalance, setAvailableBalance] = useState("₦0");
  const [unreadCount, setUnreadCount] = useState(() => notificationService.getUnreadCount());

  // Realtime Subscriptions
  useRealtimeChannel("wallet", (evt) => {
    if (evt.data && typeof evt.data.available === "number") {
      setAvailableBalance(`₦${(evt.data.available as number).toLocaleString()}`);
    }
  });

  useRealtimeChannel("notifications", () => {
    setUnreadCount(notificationService.getUnreadCount());
  });

  return (
    <header className="sticky top-0 z-30 hidden h-14 select-none items-center justify-between border-b border-border bg-topbar px-4 text-foreground backdrop-blur-md lg:flex sm:px-8">
      
      {/* Search Modal Trigger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="focus-ring flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40"
        >
          <HugeiconsIcon icon={Search01Icon} size={15} className="text-muted-foreground" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Right Actions: Clean Balance, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        
        {/* Balance Chip */}
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <span>{availableBalance}</span>
        </Link>

        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="focus-ring relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={Notification01Icon} size={18} />
            {unreadCount > 0 && (
              <>
                <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-ping rounded-full bg-primary" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              </>
            )}
          </button>

          {notificationsOpen && (
            <NotificationDropdown onClose={() => setNotificationsOpen(false)} />
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="focus-ring flex cursor-pointer items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-muted"
          >
            <Image
              src={avatarUrl}
              alt={userName}
              width={34}
              height={34}
              className="h-8 w-8 rounded-lg border border-primary/30 object-cover"
            />
            <span className="hidden text-xs font-bold text-foreground md:inline-block">
              {userName.split(" ")[0]}
            </span>
          </button>

          {profileOpen && (
            <ProfileDropdown userName={userName} onClose={() => setProfileOpen(false)} />
          )}
        </div>

      </div>
    </header>
  );
}
