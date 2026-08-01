-- Phase 3A.3 — RLS helpers + policies
-- Source: prisma/rls/0002_rls_helpers.sql + prisma/rls/0003_rls_policies.sql
-- Ensures RLS remains enabled; adds least-privilege policies for Data API defense-in-depth.

ALTER TABLE IF EXISTS public.public_id_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- ZOLANZO RLS helpers (Phase 3B.1)
-- SECURITY DEFINER + fixed search_path avoids recursive RLS when resolving identity.
-- auth.uid()::text ↔ users.auth_subject

CREATE OR REPLACE FUNCTION public.zolanzo_current_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_subject = (SELECT auth.uid()::text)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_has_platform_role(role_keys text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = public.zolanzo_current_user_id()
      AND r.key = ANY (role_keys)
  );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.zolanzo_has_platform_role(ARRAY['admin', 'super_admin']);
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_platform_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.zolanzo_has_platform_role(ARRAY[
    'admin', 'super_admin', 'operations', 'finance', 'auditor',
    'support', 'moderator', 'reviewer', 'developer'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_finance_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.zolanzo_has_platform_role(ARRAY[
    'admin', 'super_admin', 'finance', 'operations', 'auditor'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_reviewer_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.zolanzo_has_platform_role(ARRAY[
    'admin', 'super_admin', 'reviewer', 'operations', 'moderator'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_org_member(p_organization_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.organization_members m
      WHERE m.organization_id = p_organization_id
        AND m.user_id = public.zolanzo_current_user_id()
        AND m.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_org_admin(p_organization_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.id = p_organization_id
          AND o.owner_user_id = public.zolanzo_current_user_id()
      )
      OR EXISTS (
        SELECT 1
        FROM public.organization_members m
        WHERE m.organization_id = p_organization_id
          AND m.user_id = public.zolanzo_current_user_id()
          AND m.status = 'active'
          AND m.org_role IN ('owner', 'admin')
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_can_manage_org_ops(p_organization_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.zolanzo_is_org_admin(p_organization_id)
    OR EXISTS (
      SELECT 1
      FROM public.organization_members m
      WHERE m.organization_id = p_organization_id
        AND m.user_id = public.zolanzo_current_user_id()
        AND m.status = 'active'
        AND m.org_role IN ('finance', 'campaign_manager')
    );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_campaign_org_id(p_campaign_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.organization_id
  FROM public.campaigns c
  WHERE c.id = p_campaign_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_campaign_member(p_campaign_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.zolanzo_is_org_member(public.zolanzo_campaign_org_id(p_campaign_id));
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_is_assignment_party(p_assignment_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    WHERE a.id = p_assignment_id
      AND (
        a.worker_user_id = public.zolanzo_current_user_id()
        OR public.zolanzo_is_campaign_member(a.campaign_id)
        OR public.zolanzo_is_reviewer_staff()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_wallet_accessible(p_wallet_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wallets w
    WHERE w.id = p_wallet_id
      AND (
        w.owner_user_id = public.zolanzo_current_user_id()
        OR (
          w.organization_id IS NOT NULL
          AND public.zolanzo_is_org_member(w.organization_id)
        )
        OR public.zolanzo_is_finance_staff()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_payment_intent_accessible(p_payment_intent_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.payment_intents p
    WHERE p.id = p_payment_intent_id
      AND (
        p.client_user_id = public.zolanzo_current_user_id()
        OR public.zolanzo_is_org_member(p.organization_id)
        OR public.zolanzo_is_finance_staff()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.zolanzo_submission_accessible(p_submission_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = p_submission_id
      AND (
        s.worker_user_id = public.zolanzo_current_user_id()
        OR public.zolanzo_is_campaign_member(a.campaign_id)
        OR public.zolanzo_is_reviewer_staff()
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.zolanzo_current_user_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_has_platform_role(text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_platform_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_platform_staff() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_finance_staff() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_reviewer_staff() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_org_member(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_org_admin(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_can_manage_org_ops(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_campaign_org_id(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_campaign_member(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_is_assignment_party(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_wallet_accessible(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_payment_intent_accessible(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.zolanzo_submission_accessible(text) TO anon, authenticated, service_role;
-- ZOLANZO RLS policies (Phase 3B.1)
-- Least privilege for anon / authenticated. Service role bypasses RLS.
-- Mutations for money/ledger/ops remain service-role only (no client write policies).
-- Requires: 0002_rls_helpers.sql

-- ---------------------------------------------------------------------------
-- Helper: drop + recreate named policy idempotently
-- ---------------------------------------------------------------------------

-- ========== IDENTITY =======================================================

DROP POLICY IF EXISTS users_select_self_or_admin ON public.users;
CREATE POLICY users_select_self_or_admin ON public.users
  FOR SELECT TO authenticated
  USING (
    id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS users_update_self_or_admin ON public.users;
CREATE POLICY users_update_self_or_admin ON public.users
  FOR UPDATE TO authenticated
  USING (
    id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS profiles_select_self_or_staff ON public.profiles;
CREATE POLICY profiles_select_self_or_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY profiles_update_self_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.zolanzo_current_user_id());

DROP POLICY IF EXISTS sessions_own ON public.sessions;
CREATE POLICY sessions_own ON public.sessions
  FOR ALL TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (user_id = public.zolanzo_current_user_id());

DROP POLICY IF EXISTS devices_own ON public.devices;
CREATE POLICY devices_own ON public.devices
  FOR ALL TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (user_id = public.zolanzo_current_user_id());

-- ========== ORGS ===========================================================

DROP POLICY IF EXISTS organizations_select_member ON public.organizations;
CREATE POLICY organizations_select_member ON public.organizations
  FOR SELECT TO authenticated
  USING (
    owner_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_org_member(id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS organizations_update_admin ON public.organizations;
CREATE POLICY organizations_update_admin ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    public.zolanzo_is_org_admin(id)
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    public.zolanzo_is_org_admin(id)
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS organization_members_select ON public.organization_members;
CREATE POLICY organization_members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS organization_members_manage ON public.organization_members;
CREATE POLICY organization_members_manage ON public.organization_members
  FOR ALL TO authenticated
  USING (
    public.zolanzo_is_org_admin(organization_id)
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    public.zolanzo_is_org_admin(organization_id)
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS organization_invitations_select ON public.organization_invitations;
CREATE POLICY organization_invitations_select ON public.organization_invitations
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_org_member(organization_id)
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS organization_invitations_manage ON public.organization_invitations;
CREATE POLICY organization_invitations_manage ON public.organization_invitations
  FOR ALL TO authenticated
  USING (
    public.zolanzo_is_org_admin(organization_id)
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    public.zolanzo_is_org_admin(organization_id)
    OR public.zolanzo_is_platform_admin()
  );

-- ========== RBAC / CATALOG =================================================

DROP POLICY IF EXISTS roles_select_authenticated ON public.roles;
CREATE POLICY roles_select_authenticated ON public.roles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS roles_admin_write ON public.roles;
CREATE POLICY roles_admin_write ON public.roles
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS permissions_select_authenticated ON public.permissions;
CREATE POLICY permissions_select_authenticated ON public.permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS permissions_admin_write ON public.permissions;
CREATE POLICY permissions_admin_write ON public.permissions
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS role_permissions_select_authenticated ON public.role_permissions;
CREATE POLICY role_permissions_select_authenticated ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS role_permissions_admin_write ON public.role_permissions;
CREATE POLICY role_permissions_admin_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS user_roles_select_self_or_admin ON public.user_roles;
CREATE POLICY user_roles_select_self_or_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS user_roles_admin_write ON public.user_roles;
CREATE POLICY user_roles_admin_write ON public.user_roles
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS feature_flags_select_enabled_anon ON public.feature_flags;
CREATE POLICY feature_flags_select_enabled_anon ON public.feature_flags
  FOR SELECT TO anon
  USING (enabled = true);

DROP POLICY IF EXISTS feature_flags_select_authenticated ON public.feature_flags;
CREATE POLICY feature_flags_select_authenticated ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS feature_flags_admin_write ON public.feature_flags;
CREATE POLICY feature_flags_admin_write ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    actor_user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
    OR public.zolanzo_is_platform_staff()
  );

-- ========== MARKETPLACE / WORK =============================================

DROP POLICY IF EXISTS task_templates_select ON public.task_templates;
CREATE POLICY task_templates_select ON public.task_templates
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_platform_staff()
    OR (
      status = 'published'
      AND visibility IN ('platform', 'public')
    )
    OR created_by_user_id = public.zolanzo_current_user_id()
  );

DROP POLICY IF EXISTS task_templates_select_public_anon ON public.task_templates;
CREATE POLICY task_templates_select_public_anon ON public.task_templates
  FOR SELECT TO anon
  USING (
    status = 'published'
    AND visibility = 'public'
  );

DROP POLICY IF EXISTS task_templates_admin_write ON public.task_templates;
CREATE POLICY task_templates_admin_write ON public.task_templates
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS campaigns_select ON public.campaigns;
CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    client_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_platform_staff()
    OR (
      status = 'active'
      AND visibility IN ('platform', 'public')
    )
  );

DROP POLICY IF EXISTS campaigns_select_public_anon ON public.campaigns;
CREATE POLICY campaigns_select_public_anon ON public.campaigns
  FOR SELECT TO anon
  USING (
    status = 'active'
    AND visibility = 'public'
  );

DROP POLICY IF EXISTS campaigns_manage ON public.campaigns;
CREATE POLICY campaigns_manage ON public.campaigns
  FOR ALL TO authenticated
  USING (
    public.zolanzo_can_manage_org_ops(organization_id)
    OR client_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    public.zolanzo_can_manage_org_ops(organization_id)
    OR client_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS task_instances_select ON public.task_instances;
CREATE POLICY task_instances_select ON public.task_instances
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_campaign_member(campaign_id)
    OR public.zolanzo_is_platform_staff()
    OR status IN ('available', 'reserved')
    OR EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.task_instance_id = task_instances.id
        AND r.worker_user_id = public.zolanzo_current_user_id()
    )
    OR EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.task_instance_id = task_instances.id
        AND a.worker_user_id = public.zolanzo_current_user_id()
    )
  );

DROP POLICY IF EXISTS reservations_select ON public.reservations;
CREATE POLICY reservations_select ON public.reservations
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_campaign_member(campaign_id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS assignments_select ON public.assignments;
CREATE POLICY assignments_select ON public.assignments
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_campaign_member(campaign_id)
    OR public.zolanzo_is_reviewer_staff()
  );

DROP POLICY IF EXISTS execution_steps_select ON public.execution_steps;
CREATE POLICY execution_steps_select ON public.execution_steps
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_assignment_party(assignment_id));

DROP POLICY IF EXISTS assignment_steps_select ON public.assignment_steps;
CREATE POLICY assignment_steps_select ON public.assignment_steps
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_assignment_party(assignment_id));

DROP POLICY IF EXISTS assignment_timeline_events_select ON public.assignment_timeline_events;
CREATE POLICY assignment_timeline_events_select ON public.assignment_timeline_events
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_assignment_party(assignment_id));

DROP POLICY IF EXISTS assignment_notes_select ON public.assignment_notes;
CREATE POLICY assignment_notes_select ON public.assignment_notes
  FOR SELECT TO authenticated
  USING (
    author_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_assignment_party(assignment_id)
  );

DROP POLICY IF EXISTS assignment_notes_insert_own ON public.assignment_notes;
CREATE POLICY assignment_notes_insert_own ON public.assignment_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_user_id = public.zolanzo_current_user_id()
    AND public.zolanzo_is_assignment_party(assignment_id)
  );

DROP POLICY IF EXISTS submissions_select ON public.submissions;
CREATE POLICY submissions_select ON public.submissions
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_assignment_party(assignment_id)
  );

DROP POLICY IF EXISTS evidence_manifests_select ON public.evidence_manifests;
CREATE POLICY evidence_manifests_select ON public.evidence_manifests
  FOR SELECT TO authenticated
  USING (public.zolanzo_submission_accessible(submission_id));

DROP POLICY IF EXISTS evidence_items_select ON public.evidence_items;
CREATE POLICY evidence_items_select ON public.evidence_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evidence_manifests m
      WHERE m.id = evidence_items.manifest_id
        AND public.zolanzo_submission_accessible(m.submission_id)
    )
  );

DROP POLICY IF EXISTS submission_summaries_select ON public.submission_summaries;
CREATE POLICY submission_summaries_select ON public.submission_summaries
  FOR SELECT TO authenticated
  USING (public.zolanzo_submission_accessible(submission_id));

-- ========== VALIDATION / REVIEW ============================================

DROP POLICY IF EXISTS validation_profiles_select ON public.validation_profiles;
CREATE POLICY validation_profiles_select ON public.validation_profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS validation_profiles_admin_write ON public.validation_profiles;
CREATE POLICY validation_profiles_admin_write ON public.validation_profiles
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS validation_reports_select ON public.validation_reports;
CREATE POLICY validation_reports_select ON public.validation_reports
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_submission_accessible(submission_id)
    OR public.zolanzo_is_reviewer_staff()
  );

DROP POLICY IF EXISTS validation_results_select ON public.validation_results;
CREATE POLICY validation_results_select ON public.validation_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.validation_reports r
      WHERE r.id = validation_results.report_id
        AND (
          public.zolanzo_submission_accessible(r.submission_id)
          OR public.zolanzo_is_reviewer_staff()
        )
    )
  );

DROP POLICY IF EXISTS validation_evidence_snapshots_select ON public.validation_evidence_snapshots;
CREATE POLICY validation_evidence_snapshots_select ON public.validation_evidence_snapshots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.validation_reports r
      WHERE r.id = validation_evidence_snapshots.report_id
        AND (
          public.zolanzo_submission_accessible(r.submission_id)
          OR public.zolanzo_is_reviewer_staff()
        )
    )
  );

DROP POLICY IF EXISTS review_policies_select ON public.review_policies;
CREATE POLICY review_policies_select ON public.review_policies
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS review_policies_admin_write ON public.review_policies;
CREATE POLICY review_policies_admin_write ON public.review_policies
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS review_queue_items_select ON public.review_queue_items;
CREATE POLICY review_queue_items_select ON public.review_queue_items
  FOR SELECT TO authenticated
  USING (
    assigned_reviewer_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_reviewer_staff()
    OR public.zolanzo_submission_accessible(submission_id)
  );

DROP POLICY IF EXISTS review_assignments_select ON public.review_assignments;
CREATE POLICY review_assignments_select ON public.review_assignments
  FOR SELECT TO authenticated
  USING (
    reviewer_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_reviewer_staff()
  );

DROP POLICY IF EXISTS review_decisions_select ON public.review_decisions;
CREATE POLICY review_decisions_select ON public.review_decisions
  FOR SELECT TO authenticated
  USING (
    reviewer_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_reviewer_staff()
    OR public.zolanzo_submission_accessible(submission_id)
  );

DROP POLICY IF EXISTS review_findings_select ON public.review_findings;
CREATE POLICY review_findings_select ON public.review_findings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.review_decisions d
      WHERE d.id = review_findings.decision_id
        AND (
          d.reviewer_user_id = public.zolanzo_current_user_id()
          OR public.zolanzo_is_reviewer_staff()
          OR public.zolanzo_submission_accessible(d.submission_id)
        )
    )
  );

-- ========== FINANCE / LEDGER / PAYMENTS / WITHDRAWALS ======================

DROP POLICY IF EXISTS settlement_policies_select ON public.settlement_policies;
CREATE POLICY settlement_policies_select ON public.settlement_policies
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS settlement_policies_admin_write ON public.settlement_policies;
CREATE POLICY settlement_policies_admin_write ON public.settlement_policies
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS withdrawal_policies_select ON public.withdrawal_policies;
CREATE POLICY withdrawal_policies_select ON public.withdrawal_policies
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS withdrawal_policies_admin_write ON public.withdrawal_policies;
CREATE POLICY withdrawal_policies_admin_write ON public.withdrawal_policies
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS wallets_select ON public.wallets;
CREATE POLICY wallets_select ON public.wallets
  FOR SELECT TO authenticated
  USING (
    owner_user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_member(organization_id)
    )
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS wallet_projections_select ON public.wallet_projections;
CREATE POLICY wallet_projections_select ON public.wallet_projections
  FOR SELECT TO authenticated
  USING (public.zolanzo_wallet_accessible(wallet_id));

DROP POLICY IF EXISTS escrow_snapshots_select ON public.escrow_snapshots;
CREATE POLICY escrow_snapshots_select ON public.escrow_snapshots
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_campaign_member(campaign_id)
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS escrow_accounts_select ON public.escrow_accounts;
CREATE POLICY escrow_accounts_select ON public.escrow_accounts
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_campaign_member(campaign_id)
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS financial_transactions_select ON public.financial_transactions;
CREATE POLICY financial_transactions_select ON public.financial_transactions
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_finance_staff()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_member(organization_id)
    )
    OR (
      source_wallet_id IS NOT NULL
      AND public.zolanzo_wallet_accessible(source_wallet_id)
    )
    OR (
      destination_wallet_id IS NOT NULL
      AND public.zolanzo_wallet_accessible(destination_wallet_id)
    )
  );

DROP POLICY IF EXISTS ledger_journals_select ON public.ledger_journals;
CREATE POLICY ledger_journals_select ON public.ledger_journals
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_finance_staff()
    OR EXISTS (
      SELECT 1 FROM public.ledger_entries e
      WHERE e.journal_id = ledger_journals.id
        AND e.wallet_id IS NOT NULL
        AND public.zolanzo_wallet_accessible(e.wallet_id)
    )
  );

DROP POLICY IF EXISTS ledger_entries_select ON public.ledger_entries;
CREATE POLICY ledger_entries_select ON public.ledger_entries
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_finance_staff()
    OR (
      wallet_id IS NOT NULL
      AND public.zolanzo_wallet_accessible(wallet_id)
    )
  );

DROP POLICY IF EXISTS settlements_select ON public.settlements;
CREATE POLICY settlements_select ON public.settlements
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_campaign_member(campaign_id)
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS settlement_batches_select ON public.settlement_batches;
CREATE POLICY settlement_batches_select ON public.settlement_batches
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_finance_staff());

DROP POLICY IF EXISTS destination_accounts_select ON public.destination_accounts;
CREATE POLICY destination_accounts_select ON public.destination_accounts
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS destination_accounts_manage_own ON public.destination_accounts;
CREATE POLICY destination_accounts_manage_own ON public.destination_accounts
  FOR ALL TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_finance_staff()
  )
  WITH CHECK (worker_user_id = public.zolanzo_current_user_id());

DROP POLICY IF EXISTS withdrawal_intents_select ON public.withdrawal_intents;
CREATE POLICY withdrawal_intents_select ON public.withdrawal_intents
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS withdrawal_requests_select ON public.withdrawal_requests;
CREATE POLICY withdrawal_requests_select ON public.withdrawal_requests
  FOR SELECT TO authenticated
  USING (
    worker_user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS withdrawal_reservations_select ON public.withdrawal_reservations;
CREATE POLICY withdrawal_reservations_select ON public.withdrawal_reservations
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_wallet_accessible(wallet_id)
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS withdrawal_approvals_select ON public.withdrawal_approvals;
CREATE POLICY withdrawal_approvals_select ON public.withdrawal_approvals
  FOR SELECT TO authenticated
  USING (
    approver_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_finance_staff()
    OR EXISTS (
      SELECT 1 FROM public.withdrawal_requests wr
      WHERE wr.id = withdrawal_approvals.request_id
        AND wr.worker_user_id = public.zolanzo_current_user_id()
    )
  );

DROP POLICY IF EXISTS withdrawal_batches_select ON public.withdrawal_batches;
CREATE POLICY withdrawal_batches_select ON public.withdrawal_batches
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_finance_staff());

DROP POLICY IF EXISTS payment_intents_select ON public.payment_intents;
CREATE POLICY payment_intents_select ON public.payment_intents
  FOR SELECT TO authenticated
  USING (
    client_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_finance_staff()
  );

DROP POLICY IF EXISTS payment_records_select ON public.payment_records;
CREATE POLICY payment_records_select ON public.payment_records
  FOR SELECT TO authenticated
  USING (public.zolanzo_payment_intent_accessible(payment_intent_id));

DROP POLICY IF EXISTS payment_events_select ON public.payment_events;
CREATE POLICY payment_events_select ON public.payment_events
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_finance_staff()
    OR (
      payment_intent_id IS NOT NULL
      AND public.zolanzo_payment_intent_accessible(payment_intent_id)
    )
  );

-- ========== NOTIFICATIONS ==================================================

DROP POLICY IF EXISTS delivery_policies_select ON public.delivery_policies;
CREATE POLICY delivery_policies_select ON public.delivery_policies
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS delivery_policies_manage ON public.delivery_policies;
CREATE POLICY delivery_policies_manage ON public.delivery_policies
  FOR ALL TO authenticated
  USING (
    public.zolanzo_is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
  )
  WITH CHECK (
    public.zolanzo_is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
  );

DROP POLICY IF EXISTS notification_templates_select ON public.notification_templates;
CREATE POLICY notification_templates_select ON public.notification_templates
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS notification_templates_admin_write ON public.notification_templates;
CREATE POLICY notification_templates_admin_write ON public.notification_templates
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS notification_preferences_own ON public.notification_preferences;
CREATE POLICY notification_preferences_own ON public.notification_preferences
  FOR ALL TO authenticated
  USING (
    user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_admin()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
  )
  WITH CHECK (
    user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
  );

DROP POLICY IF EXISTS notification_intents_select ON public.notification_intents;
CREATE POLICY notification_intents_select ON public.notification_intents
  FOR SELECT TO authenticated
  USING (
    actor_user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_member(organization_id)
    )
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS notification_jobs_select ON public.notification_jobs;
CREATE POLICY notification_jobs_select ON public.notification_jobs
  FOR SELECT TO authenticated
  USING (
    recipient_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_staff()
  );

-- ========== OPERATIONS / AI ================================================

DROP POLICY IF EXISTS operational_commands_select ON public.operational_commands;
CREATE POLICY operational_commands_select ON public.operational_commands
  FOR SELECT TO authenticated
  USING (
    actor_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS operational_audits_select ON public.operational_audits;
CREATE POLICY operational_audits_select ON public.operational_audits
  FOR SELECT TO authenticated
  USING (
    actor_user_id = public.zolanzo_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND public.zolanzo_is_org_admin(organization_id)
    )
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS dashboard_snapshots_select ON public.dashboard_snapshots;
CREATE POLICY dashboard_snapshots_select ON public.dashboard_snapshots
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_platform_staff());

DROP POLICY IF EXISTS operational_playbooks_select ON public.operational_playbooks;
CREATE POLICY operational_playbooks_select ON public.operational_playbooks
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_platform_staff());

DROP POLICY IF EXISTS operational_playbooks_admin_write ON public.operational_playbooks;
CREATE POLICY operational_playbooks_admin_write ON public.operational_playbooks
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS ai_plugins_select ON public.ai_plugins;
CREATE POLICY ai_plugins_select ON public.ai_plugins
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS ai_plugins_admin_write ON public.ai_plugins;
CREATE POLICY ai_plugins_admin_write ON public.ai_plugins
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS ai_configurations_select ON public.ai_configurations;
CREATE POLICY ai_configurations_select ON public.ai_configurations
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS ai_configurations_manage ON public.ai_configurations;
CREATE POLICY ai_configurations_manage ON public.ai_configurations
  FOR ALL TO authenticated
  USING (
    public.zolanzo_is_org_admin(organization_id)
    OR public.zolanzo_is_platform_admin()
  )
  WITH CHECK (
    public.zolanzo_is_org_admin(organization_id)
    OR public.zolanzo_is_platform_admin()
  );

DROP POLICY IF EXISTS ai_executions_select ON public.ai_executions;
CREATE POLICY ai_executions_select ON public.ai_executions
  FOR SELECT TO authenticated
  USING (
    actor_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS ai_recommendations_select ON public.ai_recommendations;
CREATE POLICY ai_recommendations_select ON public.ai_recommendations
  FOR SELECT TO authenticated
  USING (
    public.zolanzo_is_platform_staff()
    OR EXISTS (
      SELECT 1 FROM public.ai_executions e
      WHERE e.id = ai_recommendations.execution_id
        AND (
          e.actor_user_id = public.zolanzo_current_user_id()
          OR public.zolanzo_is_org_member(e.organization_id)
        )
    )
  );

DROP POLICY IF EXISTS ai_decision_records_select ON public.ai_decision_records;
CREATE POLICY ai_decision_records_select ON public.ai_decision_records
  FOR SELECT TO authenticated
  USING (
    actor_user_id = public.zolanzo_current_user_id()
    OR public.zolanzo_is_org_member(organization_id)
    OR public.zolanzo_is_platform_staff()
  );

DROP POLICY IF EXISTS ai_decision_recommendations_select ON public.ai_decision_recommendations;
CREATE POLICY ai_decision_recommendations_select ON public.ai_decision_recommendations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_decision_records d
      WHERE d.id = ai_decision_recommendations.decision_id
        AND (
          d.actor_user_id = public.zolanzo_current_user_id()
          OR public.zolanzo_is_org_member(d.organization_id)
          OR public.zolanzo_is_platform_staff()
        )
    )
  );

-- ========== SERVICE-ROLE ONLY (deny client roles explicitly) ===============
-- Prisma / server use the DB owner or service_role (bypasses RLS).
-- These policies document intentional deny for anon + authenticated.

DROP POLICY IF EXISTS public_id_counters_deny_authenticated ON public.public_id_counters;
CREATE POLICY public_id_counters_deny_authenticated ON public.public_id_counters
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS public_id_counters_deny_anon ON public.public_id_counters;
CREATE POLICY public_id_counters_deny_anon ON public.public_id_counters
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS provider_configurations_staff_select ON public.provider_configurations;
CREATE POLICY provider_configurations_staff_select ON public.provider_configurations
  FOR SELECT TO authenticated
  USING (public.zolanzo_is_finance_staff() OR public.zolanzo_is_platform_admin());

DROP POLICY IF EXISTS provider_configurations_admin_write ON public.provider_configurations;
CREATE POLICY provider_configurations_admin_write ON public.provider_configurations
  FOR ALL TO authenticated
  USING (public.zolanzo_is_platform_admin())
  WITH CHECK (public.zolanzo_is_platform_admin());

-- _prisma_migrations: keep RLS on if present; deny clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = '_prisma_migrations'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_deny_authenticated ON public._prisma_migrations';
    EXECUTE $p$
      CREATE POLICY prisma_migrations_deny_authenticated ON public._prisma_migrations
        FOR ALL TO authenticated
        USING (false)
        WITH CHECK (false)
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS prisma_migrations_deny_anon ON public._prisma_migrations';
    EXECUTE $p$
      CREATE POLICY prisma_migrations_deny_anon ON public._prisma_migrations
        FOR ALL TO anon
        USING (false)
        WITH CHECK (false)
    $p$;
  END IF;
END $$;

COMMENT ON FUNCTION public.zolanzo_current_user_id() IS 'Maps auth.uid() to users.id via auth_subject';
COMMENT ON TABLE public.public_id_counters IS 'RLS: service-role only';
COMMENT ON TABLE public._prisma_migrations IS 'RLS: service-role only';
