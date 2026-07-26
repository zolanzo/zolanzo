import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getClientEnv, isSupabaseConfigured } from "@/lib/validation/env";

export type BrowserSupabaseClient = SupabaseClient<Database>;

/**
 * Browser Supabase client (Client Components only).
 * Returns null when public Supabase env is not configured.
 */
export function createSupabaseBrowserClient(): BrowserSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const env = getClientEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient<Database>(url, anonKey);
}
