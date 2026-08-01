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
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[900px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Alerts & Notifications
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {notificationService.getUnreadCount()} Unread
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Real-time notification engine tracking payments, approvals, withdrawals, and security alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="h-[38px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Mark All as Read
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          {(["All", "Unread", "Applications", "Payments", "Withdrawals", "Security"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#008744]/20 border border-[#008744] text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notifications Feed */}
        {filteredItems.length === 0 ? (
          <EmptyState
            title="You're all caught up!"
            description="No active notifications in this category."
          />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((n) => {
              const Icon = getCategoryIcon(n.category);
              return (
                <Link
                  key={n.id}
                  href={n.deepLink}
                  onClick={() => handleMarkItemRead(n.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 block ${
                    !n.readAt
                      ? "bg-zinc-900/90 border-emerald-500/30 ring-1 ring-emerald-500/20"
                      : "bg-[#0A0F12] border-white/10 opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-white/5">
                      <HugeiconsIcon icon={Icon} size={20} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">{n.title}</h3>
                        {!n.readAt && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{n.body}</p>
                      <span className="text-[10px] text-zinc-500 font-semibold block pt-1">{n.createdAt}</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-zinc-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
