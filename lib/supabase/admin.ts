import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { AppError } from "@/lib/api/response";
import { getEnv, isServiceRoleConfigured } from "@/lib/validation/env";

export type AdminSupabaseClient = SupabaseClient<Database>;

/**
 * Admin / elevated Supabase client (service role).
 * Server-only. Never expose to the browser.
 */
export function createSupabaseAdminClient(): AdminSupabaseClient {
  if (!isServiceRoleConfigured()) {
    throw new AppError(
      "SUPABASE_SERVICE_ROLE_MISSING",
      "Supabase service role is not configured",
      503,
    );
  }

  const env = getEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new AppError(
      "SUPABASE_SERVICE_ROLE_MISSING",
      "Supabase service role credentials are incomplete",
      503,
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
