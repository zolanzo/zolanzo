"use client";

import React from "react";
import Link from "next/link";
import { notificationService } from "@/lib/notifications/service";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const items = notificationService.getNotifications().slice(0, 6);
  const unreadCount = notificationService.getUnreadCount();

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-elevated p-3 shadow-medium"
    >
      <div className="flex items-center justify-between border-b border-border pb-2">
        <p className="text-sm font-bold text-foreground">Notifications</p>
        {unreadCount > 0 ? (
          <span className="text-[11px] font-bold text-primary">{unreadCount} unread</span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="py-5 text-center text-xs text-muted-foreground">No notifications yet.</p>
      ) : (
        <ul className="divide-y divide-border py-1">
          {items.map((item) => (
            <li key={item.id} className="py-2">
              <p className="text-xs font-bold text-foreground">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/notifications"
        onClick={onClose}
        className="block border-t border-border pt-2 text-center text-[11px] font-bold text-primary"
      >
        View all
      </Link>
    </div>
  );
}
