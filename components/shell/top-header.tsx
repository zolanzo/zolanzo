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

export function TopHeader({ userName = "Grace Adebayo", avatarUrl = "/brand/lady1.png" }: TopHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [availableBalance, setAvailableBalance] = useState("₦283,600");
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
    <header className="h-16 bg-[#04090B] border-b border-white/10 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      
      {/* Search Input Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-xs hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Search01Icon} size={16} className="text-zinc-500" />
            <span>Search opportunities, applications, transactions...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Right Actions: Live Earnings Badge, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        
        {/* Live Balance Chip */}
        <Link
          href="/wallet"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold hover:bg-[#008744] hover:text-white transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#008744] animate-pulse" />
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
            className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center relative transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Notification01Icon} size={18} />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
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
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <Image
              src={avatarUrl}
              alt={userName}
              width={34}
              height={34}
              className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30"
            />
            <span className="hidden md:inline-block text-xs font-bold text-zinc-200">
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
