import "server-only";

import { prisma } from "@/lib/prisma/client";
import { applySignupProductRole } from "@/lib/auth/apply-product-role";
import { authPasswordFromPin } from "@/lib/auth/pin-credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SignupProductRole } from "@/lib/auth/product-identity";

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

async function loadAccount(userId: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ id: userId }, { authSubject: userId }] },
    select: {
      id: true,
      authSubject: true,
      email: true,
    },
  });
  if (!user?.email || !user.authSubject) {
    throw new Error("Profile could not be loaded.");
  }
  return user;
}

async function verifyPinAgainstAuth(email: string, pin: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Authentication service is unreachable. Please try again shortly.");
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: authPasswordFromPin(pin),
  });
  if (error) {
    throw new Error("Current PIN is incorrect.");
  }
}

export class SettingsService {
  /**
   * Change User Role (Switch to Earn Account <-> Switch to Hire Account)
   */
  static async changeRole(userId: string, newRole: SignupProductRole) {
    const user = await loadAccount(userId);
    const synced = await applySignupProductRole({
      userId: user.id,
      authSubject: user.authSubject,
      role: newRole,
    });
    return { success: true, role: newRole, ...synced };
  }

  /**
   * Change 6-Digit PIN
   */
  static async changePin(userId: string, oldPin: string, newPin: string) {
    if (!/^\d{6}$/.test(newPin)) {
      throw new Error("New PIN must contain exactly 6 digits.");
    }

    const user = await loadAccount(userId);
    await verifyPinAgainstAuth(user.email!, oldPin);

    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.authSubject!, {
      password: authPasswordFromPin(newPin),
    });
    if (error) {
      throw new Error("PIN could not be updated.");
    }

    return { success: true };
  }

  /**
   * Delete Account Architecture
   */
  static async deleteAccount(userId: string, confirmPin: string) {
    const user = await loadAccount(userId);
    try {
      await verifyPinAgainstAuth(user.email!, confirmPin);
    } catch {
      throw new Error("PIN verification failed.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: "suspended" },
    });

    return { success: true };
  }
}
