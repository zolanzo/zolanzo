import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getEnv, isSupabaseConfigured } from "@/lib/validation/env";

export type ServerSupabaseClient = SupabaseClient<Database>;

/**
 * Server Supabase client (Server Components, Route Handlers).
 * Cookie writes may no-op in pure Server Components — middleware refreshes sessions.
 */
export async function createSupabaseServerClient(): Promise<ServerSupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const env = getEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component — session refresh happens in middleware.
        }
      },
    },
  });
}
