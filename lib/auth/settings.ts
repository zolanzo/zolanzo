import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatStoredPin, verifyStoredPin } from "@/lib/security/hash";

export interface NotificationPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  taskUpdates: boolean;
  promotional: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "private" | "employers_only";
  showEarnings: boolean;
}

export class SettingsService {
  /**
   * Change User Role (Switch to Earn Account <-> Switch to Hire Account)
   */
  static async changeRole(userId: string, newRole: "worker" | "employer") {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ role: newRole })
        .eq("id", userId);
    }
    return { success: true, role: newRole };
  }

  /**
   * Change 6-Digit PIN
   */
  static async changePin(userId: string, oldPin: string, newPin: string) {
    const supabase = await createSupabaseServerClient();
    if (!/^\d{6}$/.test(newPin)) {
      throw new Error("New PIN must contain exactly 6 digits.");
    }

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("pin_hash")
        .eq("id", userId)
        .single();

      if (!profile || !verifyStoredPin(oldPin, profile.pin_hash)) {
        throw new Error("Current PIN is incorrect.");
      }

      const newPinHash = formatStoredPin(newPin);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ pin_hash: newPinHash })
        .eq("id", userId);
    }

    return { success: true };
  }

  /**
   * Delete Account Architecture
   */
  static async deleteAccount(userId: string, confirmPin: string) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("pin_hash")
        .eq("id", userId)
        .single();

      if (!profile || !verifyStoredPin(confirmPin, profile.pin_hash)) {
        throw new Error("PIN verification failed.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ status: "suspended" })
        .eq("id", userId);
    }

    return { success: true };
  }
}
