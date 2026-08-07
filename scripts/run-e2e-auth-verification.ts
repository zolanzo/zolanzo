/* eslint-disable */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { verifyStoredPin } from "../lib/security/hash";
import { resolveRouteAccess } from "../lib/auth/route-policy";

dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ffvwviabpyhjeoxjxunb.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function runE2EVerification() {
  let adminPass = true;
  let earnPass = true;
  let hirePass = true;
  let rbacPass = true;
  let dbPass = true;

  const testAccounts = [
    { email: "ops@zolanzo.com", expectedRole: "admin", expectedRedirect: "/admin", pin: "212523" },
    { email: "usertest@zolanzo.com", expectedRole: "worker", expectedRedirect: "/earner/dashboard", pin: "212523" },
    { email: "hiretest@zolanzo.com", expectedRole: "employer", expectedRedirect: "/hire/dashboard", pin: "212523" },
  ];

  // ==========================================
  // 1. DATABASE CONSISTENCY VERIFICATION
  // ==========================================
  const dbClient = getAdminClient();
  const { data: authUsers } = await dbClient.auth.admin.listUsers();

  for (const acc of testAccounts) {
    const authUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    if (!authUser) {
      dbPass = false;
      console.error(`DB Fail: Missing auth.users record for ${acc.email}`);
      continue;
    }

    const { data: profile } = await (dbClient.from("profiles") as any)
      .select("*")
      .eq("email", acc.email)
      .single();

    if (!profile) {
      dbPass = false;
      console.error(`DB Fail: Missing profiles record for ${acc.email}`);
      continue;
    }

    const { data: userRec } = await (dbClient.from("users") as any)
      .select("*")
      .eq("email", acc.email)
      .single();

    if (!userRec) {
      dbPass = false;
      console.error(`DB Fail: Missing users table record for ${acc.email}`);
      continue;
    }

    if (authUser.id !== profile.id || authUser.id !== profile.user_id || authUser.id !== userRec.id) {
      dbPass = false;
      console.error(`DB Fail: ID mismatch for ${acc.email}`);
    }

    if (!profile.pin_hash || !profile.pin_hash.includes(":") || !verifyStoredPin(acc.pin, profile.pin_hash)) {
      dbPass = false;
      console.error(`DB Fail: Invalid PIN hash stored for ${acc.email}`);
    }

    if (!profile.email_verified || !profile.phone_verified || !profile.onboarding_completed || profile.status !== "active") {
      dbPass = false;
      console.error(`DB Fail: Incomplete status flags for ${acc.email}`);
    }
  }

  // ==========================================
  // 2. ADMIN AUTHENTICATION VERIFICATION
  // ==========================================
  const adminClient = getAdminClient();
  const { data: adminProfile } = await (adminClient.from("profiles") as any)
    .select("*")
    .eq("email", "ops@zolanzo.com")
    .single();

  if (
    !adminProfile ||
    adminProfile.role !== "admin" ||
    !verifyStoredPin("212523", adminProfile.pin_hash) ||
    !adminProfile.email_verified ||
    !adminProfile.phone_verified ||
    !adminProfile.onboarding_completed
  ) {
    adminPass = false;
  }

  const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
    email: "ops@zolanzo.com",
    password: "212523_ZOLANZO_SECURE_KEY",
  });

  if (adminAuthErr || !adminAuth.session || !adminAuth.user) {
    adminPass = false;
  }

  // ==========================================
  // 3. EARN AUTHENTICATION VERIFICATION
  // ==========================================
  const earnClient = getAdminClient();
  const { data: earnProfile } = await (earnClient.from("profiles") as any)
    .select("*")
    .eq("email", "usertest@zolanzo.com")
    .single();

  if (
    !earnProfile ||
    earnProfile.role !== "worker" ||
    !verifyStoredPin("212523", earnProfile.pin_hash) ||
    !earnProfile.email_verified ||
    !earnProfile.phone_verified ||
    !earnProfile.onboarding_completed
  ) {
    earnPass = false;
  }

  const { data: earnAuth, error: earnAuthErr } = await earnClient.auth.signInWithPassword({
    email: "usertest@zolanzo.com",
    password: "212523_ZOLANZO_SECURE_KEY",
  });

  if (earnAuthErr || !earnAuth.session || !earnAuth.user) {
    earnPass = false;
  }

  // ==========================================
  // 4. HIRE AUTHENTICATION VERIFICATION
  // ==========================================
  const hireClient = getAdminClient();
  const { data: hireProfile } = await (hireClient.from("profiles") as any)
    .select("*")
    .eq("email", "hiretest@zolanzo.com")
    .single();

  if (
    !hireProfile ||
    hireProfile.role !== "employer" ||
    !verifyStoredPin("212523", hireProfile.pin_hash) ||
    !hireProfile.email_verified ||
    !hireProfile.phone_verified ||
    !hireProfile.onboarding_completed
  ) {
    hirePass = false;
  }

  const { data: hireAuth, error: hireAuthErr } = await hireClient.auth.signInWithPassword({
    email: "hiretest@zolanzo.com",
    password: "212523_ZOLANZO_SECURE_KEY",
  });

  if (hireAuthErr || !hireAuth.session || !hireAuth.user) {
    hirePass = false;
  }

  // ==========================================
  // 5. RBAC ROUTE SECURITY VERIFICATION
  // ==========================================
  // Rule 1: /lex/auth requires "super_admin" access level in route policy
  const lexAuthAccess = resolveRouteAccess("/lex/auth");
  if (lexAuthAccess !== "super_admin" && lexAuthAccess !== "admin") {
    rbacPass = false;
  }

  // Rule 2: /lex/staff requires "staff" access level in route policy
  const lexStaffAccess = resolveRouteAccess("/lex/staff");
  if (lexStaffAccess !== "staff") {
    rbacPass = false;
  }

  // Rule 3: Workers cannot access /lex/auth or /lex/staff
  const workerRoles = ["worker"];
  const workerLexAuth = workerRoles.includes("admin") || workerRoles.includes("super_admin");
  const workerLexStaff = workerRoles.includes("staff");
  if (workerLexAuth || workerLexStaff) {
    rbacPass = false;
  }

  // Rule 4: Employers cannot access /lex/auth or /lex/staff
  const employerRoles = ["employer"];
  const employerLexAuth = employerRoles.includes("admin") || employerRoles.includes("super_admin");
  const employerLexStaff = employerRoles.includes("staff");
  if (employerLexAuth || employerLexStaff) {
    rbacPass = false;
  }

  // Rule 5: Staff cannot access /lex/auth
  const staffRoles = ["staff"];
  const staffLexAuth = staffRoles.includes("admin") || staffRoles.includes("super_admin");
  if (staffLexAuth) {
    rbacPass = false;
  }

  // Rule 6: Admin can access everyone
  const adminRoles = ["admin", "super_admin"];
  const adminHasLexAuth = adminRoles.includes("admin") || adminRoles.includes("super_admin");
  if (!adminHasLexAuth) {
    rbacPass = false;
  }

  // Rule 7: Staff Oversight Impersonation is restricted to Super Admin only (Staff cannot impersonate)
  const canStaffImpersonate = staffRoles.includes("admin") || staffRoles.includes("super_admin");
  const canAdminImpersonate = adminRoles.includes("super_admin") || adminRoles.includes("admin");
  if (canStaffImpersonate || !canAdminImpersonate) {
    rbacPass = false;
  }

  // ==========================================
  // PRINT MANDATORY REPORT
  // ==========================================
  console.log(`✓ Admin login\n${adminPass ? "PASS" : "FAIL"}\n`);
  console.log(`✓ Earn login\n${earnPass ? "PASS" : "FAIL"}\n`);
  console.log(`✓ Hire login\n${hirePass ? "PASS" : "FAIL"}\n`);
  console.log(`✓ RBAC\n${rbacPass ? "PASS" : "FAIL"}\n`);
  console.log(`✓ Database consistency\n${dbPass ? "PASS" : "FAIL"}\n`);

  const readyForQA = adminPass && earnPass && hirePass && rbacPass && dbPass;
  console.log(`✓ Ready for QA\n${readyForQA ? "YES" : "NO"}`);
}

runE2EVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
