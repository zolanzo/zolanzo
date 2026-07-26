-- ZOLANZO RLS framework (Sprint 1)
-- Placeholder policies only — enable and refine in auth sprint.
-- Apply after foundation tables exist.

-- Enable RLS on tenant-sensitive tables (policies added later)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Intended helper: current auth subject from JWT (Supabase)
-- CREATE OR REPLACE FUNCTION public.requesting_user_id() ...
-- Policies will use auth.uid()::text linked via users.auth_subject

-- PLACEHOLDER: deny-by-default once RLS is enabled without policies
-- for authenticated role. Service role bypasses RLS.

COMMENT ON TABLE users IS 'RLS: users may select/update own row; admins manage all';
COMMENT ON TABLE organizations IS 'RLS: members can read; owners/admins manage';
COMMENT ON TABLE organization_members IS 'RLS: members read org; admins manage membership';
COMMENT ON TABLE sessions IS 'RLS: users manage own sessions';
COMMENT ON TABLE devices IS 'RLS: users manage own devices';
COMMENT ON TABLE audit_logs IS 'RLS: org auditors read org logs; platform admins read all';
COMMENT ON TABLE feature_flags IS 'RLS: public read enabled flags; admins manage';
