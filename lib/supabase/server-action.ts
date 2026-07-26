import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getEnv, isSupabaseConfigured } from "@/lib/validation/env";
import { AppError } from "@/lib/api/response";

export type ServerActionSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client for Server Actions — cookie mutation is expected to succeed.
 */
export async function createSupabaseServerActionClient(): Promise<ServerActionSupabaseClient> {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      "SUPABASE_NOT_CONFIGURED",
      "Supabase is not configured for this environment",
      503,
    );
  }

  const env = getEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new AppError(
      "SUPABASE_NOT_CONFIGURED",
      "Supabase public credentials are missing",
      503,
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
