-- At most one unconsumed challenge per email + purpose.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email, purpose
      ORDER BY created_at DESC
    ) AS rn
  FROM public.email_verifications
  WHERE consumed_at IS NULL
)
UPDATE public.email_verifications AS e
SET consumed_at = NOW()
FROM ranked
WHERE e.id = ranked.id
  AND ranked.rn > 1
  AND e.consumed_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS email_verifications_one_active_idx
  ON public.email_verifications (email, purpose)
  WHERE consumed_at IS NULL;
