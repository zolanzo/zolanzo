import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

import { createClient } from "@supabase/supabase-js";

async function inspectDbRoles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  console.log("==================================================");
  console.log("DATABASE PROFILE & AUTH USER AUDIT");
  console.log("==================================================\n");

  const emails = [
    "testadmin@zolanzo.com",
    "testuser@zolanzo.com",
    "hirertest@zolanzo.com",
    "ops@zolanzo.com",
    "hiretest@zolanzo.com",
    "usertest@zolanzo.com",
  ];

  for (const email of emails) {
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, email, role, status, onboarding_completed, email_verified, phone_verified")
      .eq("email", email)
      .single();

    if (error || !profile) {
      console.error(`❌ Profile missing for ${email}:`, error);
      continue;
    }

    // Also fetch auth user
    const { data: authUsers } = await admin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find((u) => u.email === email);

    console.log(`Email: ${profile.email}`);
    console.log(`  ID: ${profile.id}`);
    console.log(`  Profile Role: ${profile.role}`);
    console.log(`  Auth App Roles (app_metadata):`, authUser?.app_metadata?.roles);
    console.log(`  Auth User Metadata Role:`, authUser?.user_metadata?.role);
    console.log(`  Status: ${profile.status}`);
    console.log(`  Onboarding Completed: ${profile.onboarding_completed}`);
    console.log(`  Email Verified: ${profile.email_verified}`);
    console.log(`  Phone Verified: ${profile.phone_verified}\n`);

    // Ensure Auth app_metadata and user_metadata match DB profile.role
    if (authUser && profile.role) {
      const currentAppRoles = authUser.app_metadata?.roles;
      if (!currentAppRoles || currentAppRoles[0] !== profile.role) {
        console.log(`  ⚡ Synchronizing Supabase Auth metadata for ${email} to role: ${profile.role}...`);
        await admin.auth.admin.updateUserById(authUser.id, {
          app_metadata: { ...authUser.app_metadata, roles: [profile.role] },
          user_metadata: { ...authUser.user_metadata, role: profile.role },
        });
        console.log(`  ✓ Auth metadata synchronized successfully.`);
      }
    }
  }

  console.log("==================================================");
  console.log("DATABASE AUDIT & SYNC COMPLETE");
  console.log("==================================================");
}

inspectDbRoles().catch((err) => {
  console.error("Inspection error:", err);
  process.exit(1);
});
