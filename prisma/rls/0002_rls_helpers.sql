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
