import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/auth/email";

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = createSupabaseAdminClient();
  const normalized = normalizeEmail(email);
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error("Authentication service is unreachable. Please try again shortly.");
    }
    const found = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 50) return null;
  }
}

export function isAlreadyRegisteredError(message: string | undefined): boolean {
  const text = (message ?? "").toLowerCase();
  return text.includes("already registered") || text.includes("already been registered");
}
