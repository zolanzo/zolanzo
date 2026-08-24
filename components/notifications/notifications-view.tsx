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
import { notificationService, type NotificationCategory, type NotificationItem } from "@/lib/notifications/service";
import { EmptyState } from "@/components/ui/empty-state";

export function NotificationsView() {
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
    <div className="max-w-2xl mx-auto space-y-2.5 px-4 sm:px-0 pb-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-black text-foreground">Notifications</h1>
        {items.length > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs text-primary font-bold"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {["All", "Unread", "Payments", "Withdrawals", "Applications", "Security"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`h-9 px-3 rounded-xl text-xs font-bold shrink-0 ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Account and payment alerts will appear here."
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-xs">
          {filteredItems.map((n) => {
            const IconComp = getCategoryIcon(n.category);
            const isUnread = !n.readAt;

            return (
              <div
                key={n.id}
                onClick={() => handleMarkItemRead(n.id)}
                className={`p-3.5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                  isUnread ? "bg-primary-subtle/50" : "hover:bg-hover"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread ? "bg-primary-subtle text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <HugeiconsIcon icon={IconComp} size={18} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`text-xs leading-tight truncate ${isUnread ? "font-black text-foreground" : "font-bold text-foreground"}`}>
                        {n.title}
                      </h3>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.body}</p>
                    <span className="text-[10px] text-muted-foreground block pt-0.5">{n.createdAt}</span>
                  </div>
                </div>

                {n.deepLink && (
                  <Link
                    href={n.deepLink}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-[30px] shrink-0 items-center gap-1 rounded-lg bg-muted px-2.5 text-[11px] font-bold text-foreground transition-colors hover:bg-primary-subtle hover:text-primary"
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
  );
}
