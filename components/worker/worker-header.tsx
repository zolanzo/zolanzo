"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Search01Icon } from "@hugeicons/core-free-icons";

interface WorkerHeaderProps {
  userName?: string;
  avatarUrl?: string;
  unreadNotificationsCount?: number;
}

export function WorkerHeader({
  userName = "Grace",
  avatarUrl = "/brand/lady1.png",
  unreadNotificationsCount = 3,
}: WorkerHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="w-full bg-[#04090B] border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl bg-opacity-90">
      {/* Left Greeting */}
      <div className="flex items-center gap-3">
        <Link href="/" className="shrink-0">
          <Image
            src="/brand/dark-theme-logo.webp"
            alt="ZOLANZO Logo"
            width={120}
            height={30}
            className="h-[28px] w-auto object-contain"
          />
        </Link>

        <div className="hidden sm:block w-[1px] h-6 bg-white/10 mx-1" />

        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
            Good Morning, {userName} 👋
          </h1>
          <p className="text-xs text-zinc-400">Welcome back. Let&apos;s earn something today.</p>
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Search Bar Stub */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 w-[200px]">
          <HugeiconsIcon icon={Search01Icon} size={16} />
          <span>Search tasks...</span>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors relative cursor-pointer"
            aria-label="View notifications"
          >
            <HugeiconsIcon icon={Notification01Icon} size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#0A0F12] border border-white/10 rounded-2xl shadow-2xl p-4 text-xs z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-white">Notifications</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{unreadNotificationsCount} new</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-zinc-900/80 space-y-0.5">
                  <p className="font-bold text-white">Task Approved!</p>
                  <p className="text-[11px] text-zinc-400">AI Model Annotation (+₦850) cleared to wallet.</p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-900/80 space-y-0.5">
                  <p className="font-bold text-white">Instant Payout Success</p>
                  <p className="text-[11px] text-zinc-400">₦18,400 withdrawn to GTBank account.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-950 border border-emerald-500/20 relative">
            <Image
              src={avatarUrl}
              alt={userName}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xs font-bold text-white hidden sm:inline-block pr-1">{userName}</span>
        </Link>
      </div>
    </div>
  );
}
