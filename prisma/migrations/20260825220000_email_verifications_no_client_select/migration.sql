-- OTP hashes must not be readable by the authenticated user via PostgREST.
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email verifications" ON public.email_verifications;
DROP POLICY IF EXISTS email_verifications_select_own ON public.email_verifications;
