/**
 * Operator checklist — Supabase Storage buckets + RLS policies.
 * Not a Prisma migration (no schema redesign). Apply in Supabase dashboard / SQL.
 *
 * Buckets (constants/storage.ts):
 *   public-brand (public)
 *   avatars (public)
 *   campaign-assets (private)
 *   submission-evidence (private)
 *   exports (private)
 *   temp-uploads (private)
 */

/*
-- Example: create buckets (service role / dashboard)
insert into storage.buckets (id, name, public)
values
  ('public-brand', 'public-brand', true),
  ('avatars', 'avatars', true),
  ('campaign-assets', 'campaign-assets', false),
  ('submission-evidence', 'submission-evidence', false),
  ('exports', 'exports', false),
  ('temp-uploads', 'temp-uploads', false)
on conflict (id) do nothing;

-- Private bucket: only service role via server adapters for write.
-- Authenticated users may read via signed URLs issued by Zolanzo (preferred).
-- Optional: allow owner-prefix read for avatars using auth.uid() if client uploads direct.

-- Example private read denial for anon (default)
-- storage.objects policies should NOT grant broad anon SELECT on private buckets.

-- Content-type / size enforced in Zolanzo validateUpload before signed URL issuance.
*/
