import "server-only";

/**
 * Server-side Supabase surface.
 * Browser code must import from `@/lib/supabase/client` only.
 */

export { createSupabaseServerClient } from "@/lib/supabase/server";
export { createSupabaseServerActionClient } from "@/lib/supabase/server-action";
export { createSupabaseAdminClient } from "@/lib/supabase/admin";
export { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
export type { Database } from "@/lib/supabase/database.types";
