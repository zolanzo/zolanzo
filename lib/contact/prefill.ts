import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactPrefill = {
  name: string;
  email: string;
};

export async function getContactPrefill(): Promise<ContactPrefill> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return { name: "", email: "" };
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return { name: "", email: "" };
    const metadata = user.user_metadata ?? {};
    const name =
      (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
      (typeof metadata.name === "string" && metadata.name.trim()) ||
      "";
    return {
      name,
      email: user.email?.trim() ?? "",
    };
  } catch {
    return { name: "", email: "" };
  }
}
