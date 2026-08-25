-- Email verification challenges: purpose + consume flag for a single OTP source of truth.
-- email_verifications already exists in production as a sidecar table.

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.email_verifications
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'email_verification';

ALTER TABLE public.email_verifications
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'email_verifications_purpose_check'
  ) THEN
    ALTER TABLE public.email_verifications
      ADD CONSTRAINT email_verifications_purpose_check
      CHECK (purpose IN ('email_verification', 'pin_reset'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS email_verifications_email_purpose_idx
  ON public.email_verifications (email, purpose);

CREATE INDEX IF NOT EXISTS email_verifications_active_idx
  ON public.email_verifications (email, purpose, consumed_at);
