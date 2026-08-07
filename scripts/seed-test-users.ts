/* eslint-disable */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { formatStoredPin, verifyStoredPin } from "../lib/security/hash";

dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ffvwviabpyhjeoxjxunb.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface TestAccountConfig {
  role: "admin" | "worker" | "employer";
  email: string;
  pin: string;
  fullName: string;
  handle: string;
  country?: string;
  state?: string;
  city?: string;
  companyName?: string;
  industry?: string;
  website?: string;
  expectedRedirect: string;
  label: string;
}

const TEST_ACCOUNTS: TestAccountConfig[] = [
  {
    role: "admin",
    email: "ops@zolanzo.com",
    pin: "212523",
    fullName: "ZOLANZO Administrator",
    handle: "ops",
    expectedRedirect: "/lex/auth",
    label: "Admin account ready",
  },
  {
    role: "worker",
    email: "usertest@zolanzo.com",
    pin: "212523",
    fullName: "Alex Johnson",
    handle: "usertest",
    country: "Nigeria",
    state: "Lagos",
    city: "Lekki",
    expectedRedirect: "/earner/dashboard",
    label: "Earn account ready",
  },
  {
    role: "employer",
    email: "hiretest@zolanzo.com",
    pin: "212523",
    fullName: "ZOLANZO Demo Ltd",
    handle: "hiretest",
    companyName: "ZOLANZO Demo Ltd",
    industry: "Technology",
    country: "Nigeria",
    state: "Lagos",
    city: "Victoria Island",
    website: "https://demo.zolanzo.com",
    expectedRedirect: "/hirer/dashboard",
    label: "Hire account ready",
  },
];

async function seedTestUsers() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Ensure RBAC Super Admin Role exists
  const { data: existingRoles } = await (supabase.from("roles") as any).select("*").eq("key", "super_admin");
  let superAdminRoleId = existingRoles?.[0]?.id;

  if (!superAdminRoleId) {
    const roleId = "role_super_admin";
    await (supabase.from("roles") as any).upsert({
      id: roleId,
      key: "super_admin",
      name: "Super Administrator",
      description: "Full unrestricted access to all platform admin modules",
      hierarchy: 100,
    }, { onConflict: "key" });
    superAdminRoleId = roleId;
  }

  for (const account of TEST_ACCOUNTS) {
    const password = `${account.pin}_ZOLANZO_SECURE_KEY`;
    const pinHash = formatStoredPin(account.pin);
    const now = new Date().toISOString();

    // 1. Check if user exists in Supabase Auth
    const { data: userList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = userList?.users?.find((u) => u.email?.toLowerCase() === account.email.toLowerCase());
    let userId: string;

    if (existingAuthUser) {
      userId = existingAuthUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { full_name: account.fullName },
      });
    } else {
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { full_name: account.fullName },
      });

      if (createError || !newAuthUser.user) {
        throw new Error(`Failed to create auth user ${account.email}: ${createError?.message}`);
      }
      userId = newAuthUser.user.id;
    }

    // 2. Upsert Postgres `users` table record
    const accountType = account.role === "admin" ? "super_admin" : account.role === "employer" ? "organization" : "individual";
    await (supabase.from("users") as any).upsert({
      id: userId,
      auth_subject: userId,
      email: account.email,
      account_type: accountType,
      status: "active",
      email_verified_at: now,
      phone_verified_at: now,
      updated_at: now,
    }, { onConflict: "id" });

    // 3. Upsert Postgres `profiles` table record
    const profilePayload: Record<string, unknown> = {
      id: userId,
      user_id: userId,
      display_name: account.fullName,
      handle: account.handle,
      full_name: account.fullName,
      email: account.email,
      role: account.role,
      pin_hash: pinHash,
      email_verified: true,
      phone_verified: true,
      first_login_completed: true,
      onboarding_completed: true,
      profile_completion: 100,
      status: "active",
      referral_code: `ZOL${Math.floor(10000 + Math.random() * 90000)}`,
      created_at: now,
      updated_at: now,
    };

    if (account.country) profilePayload.country = account.country;
    if (account.state) profilePayload.state = account.state;
    if (account.city) profilePayload.city = account.city;
    if (account.companyName) profilePayload.company_name = account.companyName;
    if (account.industry) profilePayload.industry = account.industry;
    if (account.website) profilePayload.website = account.website;

    const { error: profileError } = await (supabase.from("profiles") as any).upsert(profilePayload, {
      onConflict: "id",
    });

    if (profileError) {
      throw new Error(`Profile upsert failed for ${account.email}: ${profileError.message}`);
    }

    // 4. If Admin account, attach Super Admin RBAC role
    if (account.role === "admin" && superAdminRoleId) {
      await (supabase.from("user_roles") as any).upsert({
        user_id: userId,
        role_id: superAdminRoleId,
      }, { onConflict: "user_id,role_id" });
    }
  }

  // 5. Print exact requested output
  TEST_ACCOUNTS.forEach((acc, index) => {
    console.log(`✓ ${acc.label}\n`);
    console.log(`Email:\n${acc.email}\n`);
    console.log(`PIN:\n${acc.pin}\n`);
    if (index < TEST_ACCOUNTS.length - 1) {
      console.log("--------------------------------\n");
    }
  });

  // 6. Automatic Authentication Verification
  for (const account of TEST_ACCOUNTS) {
    // Fetch profile from database
    const { data: profile, error } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("email", account.email)
      .single();

    if (error || !profile) {
      throw new Error(`Verification failed: Profile not found for ${account.email}`);
    }

    const isPinValid = verifyStoredPin(account.pin, profile.pin_hash);
    if (!isPinValid) {
      throw new Error(`Verification failed: Invalid PIN hash for ${account.email}`);
    }

    if (!profile.email_verified) {
      throw new Error(`Verification failed: Email not verified for ${account.email}`);
    }

    if (!profile.phone_verified) {
      throw new Error(`Verification failed: Phone not verified for ${account.email}`);
    }

    if (!profile.onboarding_completed) {
      throw new Error(`Verification failed: Onboarding not completed for ${account.email}`);
    }

    let redirectTarget = "/earner/dashboard";
    if (profile.role === "admin" || profile.role === "super_admin") {
      redirectTarget = "/lex/auth";
    } else if (profile.role === "employer") {
      redirectTarget = "/hirer/dashboard";
    }

    if (redirectTarget !== account.expectedRedirect) {
      throw new Error(`Verification failed: Redirect mismatch for ${account.email}. Expected ${account.expectedRedirect}, got ${redirectTarget}`);
    }
  }
}

seedTestUsers().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
