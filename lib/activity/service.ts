export type ActivityCategory =
  | "Application"
  | "Approval"
  | "Withdrawal"
  | "Referral"
  | "Achievement"
  | "Security"
  | "Profile";

export interface ActivityEvent {
  id: string;
  title: string;
  category: ActivityCategory;
  detail: string;
  timestamp: string;
  group: "Today" | "Yesterday" | "Earlier This Week" | "Earlier";
}

import { zolanzoRealtime } from "../realtime/engine";

class ActivityEngine {
  private events: ActivityEvent[] = [
    {
      id: "act_1",
      title: "Submitted Work: AI Model Image Labeling",
      category: "Application",
      detail: "Awaiting employer review in escrow",
      timestamp: "2:15 PM",
      group: "Today",
    },
    {
      id: "act_2",
      title: "Applied: Fintech App UI Testing",
      category: "Application",
      detail: "Reserved 1 slot out of 50",
      timestamp: "11:30 AM",
      group: "Today",
    },
    {
      id: "act_3",
      title: "Bank Payout Disbursed: GTBank",
      category: "Withdrawal",
      detail: "₦18,400 transferred to account 012****890",
      timestamp: "4:30 PM",
      group: "Yesterday",
    },
    {
      id: "act_4",
      title: "Approved Task: Product Background Removal",
      category: "Approval",
      detail: "+₦6,000 credited to wallet",
      timestamp: "10:00 AM",
      group: "Yesterday",
    },
    {
      id: "act_5",
      title: "Achievement Unlocked: 5-Day Streak 🔥",
      category: "Achievement",
      detail: "Maintained active daily streak bonus",
      timestamp: "3 days ago",
      group: "Earlier This Week",
    },
    {
      id: "act_6",
      title: "Invite Bonus: Grace A. Signed Up",
      category: "Referral",
      detail: "+₦1,000 referral reward credited",
      timestamp: "4 days ago",
      group: "Earlier This Week",
    },
  ];

  public getActivities(): ActivityEvent[] {
    return [...this.events];
  }

  public logEvent(event: Omit<ActivityEvent, "id">): ActivityEvent {
    const newEvent: ActivityEvent = {
      ...event,
      id: `act_${Date.now()}`,
    };
    this.events.unshift(newEvent);
    zolanzoRealtime.publish("ACTIVITY_CREATED", { activity: newEvent });
    return newEvent;
  }
}

export const activityService = new ActivityEngine();
