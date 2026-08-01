export type NotificationCategory =
  | "Applications"
  | "Payments"
  | "Approvals"
  | "Withdrawals"
  | "System"
  | "Security"
  | "Marketing";

export type NotificationPriority = "low" | "medium" | "high";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  deepLink: string;
  createdAt: string;
  readAt?: string | null;
  archived?: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

import { zolanzoRealtime } from "../realtime/engine";

class NotificationEngine {
  private notifications: NotificationItem[] = [
    {
      id: "notif_1",
      title: "Task Payout Approved (+₦850)",
      body: "Your submission for AI Model Image Labeling was approved by Kora AI Labs. Earnings credited to wallet.",
      category: "Payments",
      priority: "high",
      deepLink: "/wallet",
      createdAt: "10 mins ago",
      readAt: null,
      archived: false,
    },
    {
      id: "notif_2",
      title: "Disbursement Successful (₦18,400)",
      body: "₦18,400 has been transferred directly to your GTBank account (012****890).",
      category: "Withdrawals",
      priority: "high",
      deepLink: "/wallet",
      createdAt: "1 hour ago",
      readAt: null,
      archived: false,
    },
    {
      id: "notif_3",
      title: "New Recommended Opportunity Available",
      body: "Customer Support Live Chat Assistance (₦5,000 Payout) is now open for application.",
      category: "Applications",
      priority: "medium",
      deepLink: "/tasks/task-105",
      createdAt: "3 hours ago",
      readAt: "Today • 12:00 PM",
      archived: false,
    },
    {
      id: "notif_4",
      title: "Security Alert: New Sign-in Detected",
      body: "New sign-in from Safari on macOS (Lagos, Nigeria). Verify if this was you.",
      category: "Security",
      priority: "high",
      deepLink: "/settings",
      createdAt: "Yesterday",
      readAt: "Yesterday • 4:00 PM",
      archived: false,
    },
  ];

  private preferences: NotificationPreferences = {
    email: true,
    sms: true,
    push: true,
    inApp: true,
  };

  public getNotifications(): NotificationItem[] {
    return this.notifications.filter((n) => !n.archived);
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.readAt && !n.archived).length;
  }

  public markRead(id: string): void {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.readAt = new Date().toISOString();
      zolanzoRealtime.publish("NOTIFICATION_READ", { id, unreadCount: this.getUnreadCount() });
    }
  }

  public markAllRead(): void {
    const now = new Date().toISOString();
    this.notifications.forEach((n) => {
      n.readAt = n.readAt || now;
    });
    zolanzoRealtime.publish("NOTIFICATION_READ", { all: true, unreadCount: 0 });
  }

  public archiveNotification(id: string): void {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.archived = true;
    }
  }

  public deleteNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(newPrefs: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = { ...this.preferences, ...newPrefs };
    return this.getPreferences();
  }

  public addNotification(item: NotificationItem): void {
    this.notifications.unshift(item);
    zolanzoRealtime.publish("NOTIFICATION_CREATED", { notification: item, unreadCount: this.getUnreadCount() });
  }
}

export const notificationService = new NotificationEngine();

export function getNotifications(_userId?: string): NotificationItem[] {
  return notificationService.getNotifications();
}

export function emitNotification(
  payloadOrTitle: string | ({ title?: string; body?: string; type?: string; category?: string; deepLink?: string } & Record<string, unknown>),
  bodyStr?: string,
  categoryStr: NotificationCategory = "System",
  deepLinkStr: string = "/notifications"
): NotificationItem {
  let notif: NotificationItem;
  if (typeof payloadOrTitle === "object") {
    const title = payloadOrTitle.title || "Notification";
    const body = payloadOrTitle.body || "";
    const category = (payloadOrTitle.category || payloadOrTitle.type || "System") as NotificationCategory;
    const deepLink = payloadOrTitle.deepLink || "/notifications";
    notif = {
      id: `notif_${Date.now()}`,
      title,
      body,
      category,
      priority: "high",
      deepLink,
      createdAt: "Just now",
      readAt: null,
      archived: false,
    };
  } else {
    notif = {
      id: `notif_${Date.now()}`,
      title: payloadOrTitle,
      body: bodyStr || "",
      category: categoryStr,
      priority: "high",
      deepLink: deepLinkStr,
      createdAt: "Just now",
      readAt: null,
      archived: false,
    };
  }

  notificationService.addNotification(notif);
  return notif;
}
