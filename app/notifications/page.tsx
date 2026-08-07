"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  CheckmarkBadge01Icon,
  Coins01Icon,
  ArrowRight01Icon,
  Shield01Icon,
  ClipboardListIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { notificationService, type NotificationCategory, type NotificationItem } from "@/lib/notifications/service";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [items, setItems] = useState<NotificationItem[]>(() => notificationService.getNotifications());

  const handleMarkAllRead = () => {
    notificationService.markAllRead();
    setItems([...notificationService.getNotifications()]);
  };

  const handleMarkItemRead = (id: string) => {
    notificationService.markRead(id);
    setItems([...notificationService.getNotifications()]);
  };

  const filteredItems = items.filter((n) => {
    if (activeCategory === "Unread") return !n.readAt;
    if (activeCategory === "All") return true;
    return n.category === activeCategory;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "Payments": return CheckmarkBadge01Icon;
      case "Withdrawals": return Coins01Icon;
      case "Security": return Shield01Icon;
      case "Applications": return ClipboardListIcon;
      default: return Notification01Icon;
    }
  };

  return (
    <AppShell userName="Earner" avatarUrl="/brand/lady1.png">
      <div className="max-w-2xl mx-auto space-y-3 px-4 sm:px-0 py-1">
        
        {/* COMPACT DENSE HEADER */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#111111] tracking-tight">
              Alerts & Notifications
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#E6F4ED] text-[#0B8F4D] text-[10px] font-extrabold border border-[#0B8F4D]/20">
              {notificationService.getUnreadCount()} Unread
            </span>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-[#0B8F4D] hover:underline font-bold cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        {/* HORIZONTAL CATEGORY CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {["All", "Unread", "Payments", "Withdrawals", "Applications", "Security"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`h-[36px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#0B8F4D] text-white shadow-xs"
                  : "bg-white border border-gray-200 text-[#666666] hover:text-[#111111] hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS LIST */}
        {filteredItems.length === 0 ? (
          <EmptyState
            title="No Notifications Found"
            description="You are all caught up! Important account alerts and payment updates will appear here."
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden shadow-xs">
            {filteredItems.map((n) => {
              const IconComp = getCategoryIcon(n.category);
              const isUnread = !n.readAt;

              return (
                <div
                  key={n.id}
                  onClick={() => handleMarkItemRead(n.id)}
                  className={`p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                    isUnread ? "bg-[#E6F4ED]/30" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isUnread ? "bg-[#E6F4ED] text-[#0B8F4D]" : "bg-gray-100 text-gray-500"
                    }`}>
                      <HugeiconsIcon icon={IconComp} size={18} />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <h3 className={`text-xs leading-tight truncate ${isUnread ? "font-black text-[#111111]" : "font-bold text-[#111111]"}`}>
                          {n.title}
                        </h3>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#0B8F4D] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">{n.body}</p>
                      <span className="text-[10px] text-gray-400 block pt-0.5">{n.createdAt}</span>
                    </div>
                  </div>

                  {n.deepLink && (
                    <Link
                      href={n.deepLink}
                      onClick={(e) => e.stopPropagation()}
                      className="h-[30px] px-2.5 rounded-lg bg-gray-100 hover:bg-[#E6F4ED] text-[#111111] hover:text-[#0B8F4D] text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>View</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
