import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface MarketplaceTask {
  id: string;
  title: string;
  category: "AI" | "Social Media" | "Research" | "Writing" | "Customer Support" | "Data Entry" | "Virtual Assistant" | "Business";
  reward: string;
  rewardNumeric: number;
  estimatedTime: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  availableSlots: number;
  totalSlots: number;
  slotStatus: "Open" | "Few Slots Left" | "Almost Full" | "Premium";
  location: "Remote (Nigeria)" | "Remote (Africa)" | "Lagos, Nigeria" | "Abuja, Nigeria";
  employerName: string;
  employerRating: number;
  employerVerified: boolean;
  featured?: boolean;
  recommended?: boolean;
  shortDescription: string;
  requirements: string[];
  postedTime: string;
}

export const MOCK_TASKS: MarketplaceTask[] = [];

export async function fetchLiveOpportunitiesFromSupabase(): Promise<MarketplaceTask[]> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .eq("status", "Live")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title),
      category: (row.category as MarketplaceTask["category"]) || "Research",
      reward: `₦${Number(row.reward_per_slot || 0).toLocaleString()}`,
      rewardNumeric: Number(row.reward_per_slot || 0),
      estimatedTime: String(row.estimated_time || "15 mins"),
      difficulty: (row.difficulty as MarketplaceTask["difficulty"]) || "Medium",
      availableSlots: Number(row.available_slots || 0),
      totalSlots: Number(row.total_slots || 1),
      slotStatus: Number(row.available_slots || 0) <= 3 ? "Few Slots Left" : "Open",
      location: "Remote (Nigeria)",
      employerName: "Verified Employer",
      employerRating: 5.0,
      employerVerified: true,
      featured: true,
      recommended: true,
      shortDescription: String(row.short_description || ""),
      requirements: ["Verified User Account"],
      postedTime: new Date(String(row.created_at || Date.now())).toLocaleTimeString(),
    }));
  } catch {
    return [];
  }
}
