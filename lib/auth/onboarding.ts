import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface OnboardingProfileData {
  role: "worker" | "employer";
  country?: string;
  state?: string;
  city?: string;
  language?: string;
  companyName?: string;
  industry?: string;
  website?: string;
}

export function calculateProfileCompletion(data: Partial<OnboardingProfileData>): number {
  let score = 40; // Base score for verified account creation

  if (data.role) score += 20;
  if (data.country && data.city) score += 20;

  if (data.role === "worker") {
    if (data.language) score += 20;
  } else if (data.role === "employer") {
    if (data.companyName || data.industry) score += 20;
  }

  return Math.min(score, 100);
}

export class OnboardingService {
  static async completeOnboarding(userId: string, data: OnboardingProfileData) {
    const supabase = await createSupabaseServerClient();
    const completion = calculateProfileCompletion(data);

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("profiles") as any)
        .update({
          role: data.role,
          country: data.country || "Nigeria",
          state: data.state || "",
          city: data.city || "",
          language: data.language || "English",
          company_name: data.companyName || null,
          industry: data.industry || null,
          website: data.website || null,
          profile_completion: completion,
          onboarding_completed: true,
          first_login_completed: true,
        })
        .eq("id", userId);

      if (error) {
        throw new Error(error.message);
      }
    }

    return { success: true, profileCompletion: completion };
  }

  static async updateRole(userId: string, role: "worker" | "employer") {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ role })
        .eq("id", userId);
    }
    return { success: true };
  }
}
