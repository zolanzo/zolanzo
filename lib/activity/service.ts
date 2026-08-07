import { zolanzoRealtime } from "../realtime/engine";

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

class ActivityEngine {
  private events: ActivityEvent[] = [];

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
