import { zolanzoRealtime } from "../realtime/engine";

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

class NotificationEngine {
  private notifications: NotificationItem[] = [];

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
