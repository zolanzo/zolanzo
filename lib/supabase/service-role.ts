import "server-only";

/**
 * Service-role client alias — same elevated privileges as admin.
 * Prefer this name for background jobs / webhooks / system tasks.
 */

export {
  createSupabaseAdminClient as createSupabaseServiceRoleClient,
  type AdminSupabaseClient as ServiceRoleSupabaseClient,
} from "@/lib/supabase/admin";
