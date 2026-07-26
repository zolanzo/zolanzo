import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getClientEnv, isSupabaseConfigured } from "@/lib/validation/env";

export type MiddlewareSupabaseClient = SupabaseClient<Database>;

/**
 * Middleware Supabase client for session refresh on the edge.
 */
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
): MiddlewareSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const env = getClientEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
