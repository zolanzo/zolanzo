"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";

interface NotificationDropdownProps {
  unreadCount?: number;
  onClose?: () => void;
}

export function NotificationDropdown({ unreadCount = 3 }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors relative cursor-pointer"
        aria-label="View notifications"
      >
        <HugeiconsIcon icon={Notification01Icon} size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-extrabold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#131922] border border-white/[0.08] rounded-2xl shadow-2xl p-4 text-xs z-50 animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <span className="font-bold text-white text-sm">Notifications</span>
            <span className="text-[10px] text-emerald-400 font-semibold">{unreadCount} unread</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-[#0D1218] border border-white/[0.08] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
                <span>Task Payout Approved</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                AI Image Annotation (+₦850) cleared directly into your wallet.
              </p>
              <span className="text-[9px] text-zinc-500 block pt-0.5">10 mins ago</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D1218] border border-white/[0.08] space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
                <span>Withdrawal Processed</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                ₦18,400 successfully disbursed to GTBank account.
              </p>
              <span className="text-[9px] text-zinc-500 block pt-0.5">1 hour ago</span>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-2 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-emerald-400 font-bold hover:underline"
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
