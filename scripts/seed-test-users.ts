/* eslint-disable */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { formatStoredPin, verifyStoredPin } from "../lib/security/hash";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
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
    email: "testadmin@zolanzo.com",
    pin: "212523",
    fullName: "ZOLANZO Test Admin",
    handle: "testadmin",
    expectedRedirect: "/lex/auth",
    label: "Admin test account ready",
  },
  {
    role: "worker",
    email: "testuser@zolanzo.com",
    pin: "212523",
    fullName: "ZOLANZO Test Earner",
    handle: "testuser",
    country: "Nigeria",
    state: "Lagos",
    city: "Lekki",
    expectedRedirect: "/earner/dashboard",
    label: "Earner test account ready",
  },
  {
    role: "employer",
    email: "hirertest@zolanzo.com",
    pin: "212523",
    fullName: "ZOLANZO Test Hirer",
    handle: "hirertest",
    companyName: "ZOLANZO Test Org Ltd",
    industry: "Technology",
    country: "Nigeria",
    state: "Lagos",
    city: "Victoria Island",
    website: "https://demo.zolanzo.com",
    expectedRedirect: "/hirer/dashboard",
    label: "Hirer test account ready",
  },
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

function randomOrgPublicId(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let segment = "";
  for (let i = 0; i < 6; i += 1) {
    segment += alphabet[Math.floor(Math.random() * alphabet.length)] ?? "2";
  }
  return `ORG-${segment}`;
}

async function ensureHirerOrganization(
  supabase: any,
  userId: string,
  account: TestAccountConfig,
) {
  const now = new Date().toISOString();
  const { data: existing } = await (supabase.from("organizations") as any)
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1);

  let organizationId = existing?.[0]?.id as string | undefined;
  const slug = `hirer-${account.handle}`;

  if (!organizationId) {
    organizationId = crypto.randomUUID();
    const { error } = await (supabase.from("organizations") as any).insert({
      id: organizationId,
      public_id: randomOrgPublicId(),
      name: account.companyName || account.fullName,
      slug,
      kind: "business",
      owner_user_id: userId,
      billing_email: account.email,
      plan: "free",
      white_label_enabled: false,
      created_at: now,
      updated_at: now,
    });
    if (error) {
      const { data: bySlug } = await (supabase.from("organizations") as any)
        .select("id")
        .eq("slug", slug)
        .limit(1);
      organizationId = bySlug?.[0]?.id;
      if (!organizationId) {
        throw new Error(`Organization create failed for ${account.email}: ${error.message}`);
      }
    }
  }

  const { data: member } = await (supabase.from("organization_members") as any)
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .limit(1);

  if (!member?.[0]) {
    const { error: memberError } = await (supabase.from("organization_members") as any).insert({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      user_id: userId,
      org_role: "owner",
      status: "active",
      invited_at: now,
      joined_at: now,
      created_at: now,
      updated_at: now,
    });
    if (memberError) {
      throw new Error(`Membership create failed for ${account.email}: ${memberError.message}`);
    }
  }

  await (supabase.from("users") as any)
    .update({
      active_organization_id: organizationId,
      participation: "client",
    })
    .eq("id", userId);
}

async function assertAuthApiReachable(url: string) {
  const healthUrl = `${url.replace(/\/$/, "")}/auth/v1/health`;
  try {
    const response = await fetch(healthUrl, { method: "GET" });
    if (!response.ok && response.status !== 401) {
      throw new Error(`Auth health returned HTTP ${response.status}`);
    }
  } catch (error) {
    const cause =
      error instanceof Error
        ? (error as Error & { cause?: { code?: string; message?: string } }).cause
        : undefined;
    const detail = cause?.code || (error instanceof Error ? error.message : "unknown");
    throw new Error(
      `Supabase Auth is unreachable (${detail}). Seed cannot create test users. Confirm NEXT_PUBLIC_SUPABASE_URL resolves and the project is active. No application credentials were changed.`,
    );
  }
}

async function seedTestUsers() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required to seed test users.",
    );
  }

  await assertAuthApiReachable(SUPABASE_URL);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Ensure RBAC Super Admin Role exists
  const { data: existingRoles, error: rolesReadError } = await (supabase.from("roles") as any).select("*").eq("key", "super_admin");
  if (rolesReadError) {
    throw new Error(`Failed to read roles catalog: ${rolesReadError.message}`);
  }
  let superAdminRoleId = existingRoles?.[0]?.id;

  if (!superAdminRoleId) {
    const roleId = "role_super_admin";
    const now = new Date().toISOString();
    const { error: roleUpsertError } = await (supabase.from("roles") as any).upsert({
      id: roleId,
      key: "super_admin",
      name: "Super Administrator",
      description: "Full unrestricted access to all platform admin modules",
      hierarchy: 100,
      created_at: now,
      updated_at: now,
    }, { onConflict: "key" });
    if (roleUpsertError) {
      throw new Error(`Failed to upsert super_admin role: ${roleUpsertError.message}`);
    }
    superAdminRoleId = roleId;
  }

  for (const account of TEST_ACCOUNTS) {
    const password = `${account.pin}_ZOLANZO_SECURE_KEY`;
    const pinHash = formatStoredPin(account.pin);
    const now = new Date().toISOString();

    // 1. Check if user exists in Supabase Auth
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list auth users while seeding ${account.email}: ${listError.message}`);
    }
    const existingAuthUser = userList?.users?.find((u) => u.email?.toLowerCase() === account.email.toLowerCase());
    let userId: string;

    if (existingAuthUser) {
      userId = existingAuthUser.id;
      await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        phone_confirm: true,
        app_metadata: {
          ...(existingAuthUser.app_metadata ?? {}),
          roles: [account.role],
        },
        user_metadata: { full_name: account.fullName, role: account.role },
      });
    } else {
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password,
        email_confirm: true,
        phone_confirm: true,
        app_metadata: { roles: [account.role] },
        user_metadata: { full_name: account.fullName, role: account.role },
      });

      if (createError || !newAuthUser.user) {
        throw new Error(`Failed to create auth user ${account.email}: ${createError?.message}`);
      }
      userId = newAuthUser.user.id;
    }

    // 2. Upsert Postgres `users` table record
    const accountType = account.role === "admin" ? "super_admin" : account.role === "employer" ? "organization" : "individual";
    const userRow: Record<string, unknown> = {
      id: userId,
      auth_subject: userId,
      email: account.email,
      account_type: accountType,
      status: "active",
      email_verified_at: now,
      phone_verified_at: now,
      updated_at: now,
    };
    if (account.role === "employer") userRow.participation = "client";
    if (account.role === "worker") userRow.participation = "worker";
    await (supabase.from("users") as any).upsert(userRow, { onConflict: "id" });

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

    if (account.role === "employer") {
      await ensureHirerOrganization(supabase, userId, account);
    }

    // 4. Attach platform RBAC roles (admin → super_admin, worker, client)
    const roleKeys =
      account.role === "admin"
        ? ["super_admin", "admin"]
        : account.role === "employer"
          ? ["client"]
          : ["worker"];

    for (const key of roleKeys) {
      const { data: roleRows, error: roleLookupError } = await (supabase.from("roles") as any).select("id").eq("key", key).limit(1);
      if (roleLookupError) {
        throw new Error(`Role lookup failed for ${key}: ${roleLookupError.message}`);
      }
      const roleId = roleRows?.[0]?.id;
      if (!roleId) {
        throw new Error(`Required platform role '${key}' is missing from the roles catalog. Seed permissions/roles before test users.`);
      }
      const { error: userRoleError } = await (supabase.from("user_roles") as any).upsert(
        { user_id: userId, role_id: roleId },
        { onConflict: "user_id,role_id" },
      );
      if (userRoleError) {
        throw new Error(`Failed to attach role ${key} to ${account.email}: ${userRoleError.message}`);
      }
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
