-- ZOLANZO Business Engine Schema Migration (Idempotent & Production-Compatible)

-- 1. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
  escrow_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (escrow_balance >= 0),
  pending_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add columns if wallets table previously existed in remote database
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS available_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS escrow_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. WALLET LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'WITHDRAWAL', 'REFERRAL_BONUS', 'PLATFORM_FEE')),
  amount NUMERIC(15, 2) NOT NULL,
  reference TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallet_ledger
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'DEPOSIT',
  ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS reference TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Research',
  short_description TEXT NOT NULL DEFAULT '',
  reward_per_slot NUMERIC(15, 2) NOT NULL DEFAULT 1.00 CHECK (reward_per_slot > 0),
  total_slots INT NOT NULL DEFAULT 1 CHECK (total_slots > 0),
  available_slots INT NOT NULL DEFAULT 1 CHECK (available_slots >= 0),
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  estimated_time TEXT NOT NULL DEFAULT '15 mins',
  status TEXT NOT NULL DEFAULT 'Live' CHECK (status IN ('Draft', 'EscrowFunded', 'Live', 'Paused', 'Completed', 'Archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Research',
  ADD COLUMN IF NOT EXISTS short_description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reward_per_slot NUMERIC(15, 2) NOT NULL DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS total_slots INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS available_slots INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  ADD COLUMN IF NOT EXISTS estimated_time TEXT NOT NULL DEFAULT '15 mins',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Live',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 4. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Accepted', 'InWork', 'Submitted', 'AwaitingReview', 'Approved', 'Rejected', 'RevisionRequested', 'Paid')),
  evidence_text TEXT,
  evidence_file_name TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Applied',
  ADD COLUMN IF NOT EXISTS evidence_text TEXT,
  ADD COLUMN IF NOT EXISTS evidence_file_name TEXT,
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- 5. ESCROW ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_locked NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  released_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  refunded_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED', 'DISBURSED', 'PARTIALLY_RELEASED', 'REFUNDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.escrow_accounts
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_locked NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS released_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'LOCKED',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- INDEXES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_ledger' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_ledger_user_id ON public.wallet_ledger(user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'created_by') THEN
    CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON public.opportunities(created_by);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'worker_id') THEN
    CREATE INDEX IF NOT EXISTS idx_applications_worker_id ON public.applications(worker_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'opportunity_id') THEN
    CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON public.applications(opportunity_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'escrow_accounts' AND column_name = 'campaign_id') THEN
    CREATE INDEX IF NOT EXISTS idx_escrow_campaign_id ON public.escrow_accounts(campaign_id);
  END IF;
END $$;

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;

-- SAFE RLS POLICIES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallets' AND policyname = 'Users can view own wallet') THEN
    CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_ledger' AND policyname = 'Users can view own ledger') THEN
    CREATE POLICY "Users can view own ledger" ON public.wallet_ledger FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'opportunities' AND policyname = 'Everyone can view live opportunities') THEN
    CREATE POLICY "Everyone can view live opportunities" ON public.opportunities FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'Workers can view own applications') THEN
    CREATE POLICY "Workers can view own applications" ON public.applications FOR SELECT USING (auth.uid() = worker_id);
  END IF;
END $$;
