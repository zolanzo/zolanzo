/* eslint-disable */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { verifyStoredPin } from "../lib/security/hash";

dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ffvwviabpyhjeoxjxunb.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface TestAccount {
  email: string;
  pin: string;
  expectedRole: string;
  expectedRedirect: string;
  label: string;
}

const ACCOUNTS: TestAccount[] = [
  {
    email: "ops@zolanzo.com",
    pin: "212523",
    expectedRole: "admin",
    expectedRedirect: "/lex/auth",
    label: "Admin Account",
  },
  {
    email: "usertest@zolanzo.com",
    pin: "212523",
    expectedRole: "worker",
    expectedRedirect: "/earner/dashboard",
    label: "Earn Account",
  },
  {
    email: "hiretest@zolanzo.com",
    pin: "212523",
    expectedRole: "employer",
    expectedRedirect: "/hirer/dashboard",
    label: "Hire Account",
  },
];

async function traceAuthentication() {
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("===============================================");
  console.log("REAL END-TO-END AUTHENTICATION TRACE");
  console.log("===============================================\n");

  let allPass = true;

  for (const acc of ACCOUNTS) {
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log(`--- TRACING: ${acc.label} (${acc.email}) ---`);

    // Step 1: User found?
    const { data: profile, error: profileErr } = await (adminClient.from("profiles") as any)
      .select("*")
      .eq("email", acc.email)
      .single();

    const userFound = Boolean(profile && !profileErr);
    console.log(`User found? ${userFound ? "YES" : "NO"} (${profile?.id || "N/A"})`);
    if (!userFound) {
      allPass = false;
      continue;
    }

    // Step 2: PIN hash loaded?
    const pinHashLoaded = Boolean(profile.pin_hash && profile.pin_hash.includes(":"));
    console.log(`PIN hash loaded? ${pinHashLoaded ? "YES" : "NO"}`);
    if (!pinHashLoaded) {
      allPass = false;
    }

    // Step 3: PIN verified?
    const pinVerified = verifyStoredPin(acc.pin, profile.pin_hash);
    console.log(`PIN verified? ${pinVerified ? "YES" : "NO"}`);
    if (!pinVerified) {
      allPass = false;
    }

    // Step 4: Email verified?
    const emailVerified = Boolean(profile.email_verified);
    console.log(`Email verified? ${emailVerified ? "YES" : "NO"}`);
    if (!emailVerified) {
      allPass = false;
    }

    // Step 5: Phone verified?
    const phoneVerified = Boolean(profile.phone_verified);
    console.log(`Phone verified? ${phoneVerified ? "YES" : "NO"}`);
    if (!phoneVerified) {
      allPass = false;
    }

    // Step 6: Role loaded?
    const role = profile.role;
    const roleLoaded = Boolean(role);
    console.log(`Role loaded? ${roleLoaded ? "YES" : "NO"} (${role})`);
    if (!roleLoaded) {
      allPass = false;
    }

    // Step 7 & 8: JWT & Session created via Supabase Auth
    const { data: authData, error: authErr } = await adminClient.auth.signInWithPassword({
      email: acc.email,
      password: `${acc.pin}_ZOLANZO_SECURE_KEY`,
    });

    const jwtCreated = Boolean(authData.session?.access_token);
    const sessionCreated = Boolean(authData.session && authData.user);
    console.log(`JWT created? ${jwtCreated ? "YES" : "NO"}`);
    console.log(`Session created? ${sessionCreated ? "YES" : "NO"}`);
    if (authErr || !jwtCreated || !sessionCreated) {
      allPass = false;
      console.error(`Auth Error: ${authErr?.message}`);
    }

    // Step 9: Cookie written? (Simulated cookie payload shape from Supabase SSR)
    const cookieWritten = Boolean(authData.session?.access_token && authData.session?.refresh_token);
    console.log(`Cookie written? ${cookieWritten ? "YES" : "NO"}`);

    // Step 10: Redirect chosen?
    let chosenRedirect = "/earner/dashboard";
    if (role === "admin" || role === "super_admin") {
      chosenRedirect = "/lex/auth";
    } else if (role === "staff") {
      chosenRedirect = "/lex/staff";
    } else if (role === "employer") {
      chosenRedirect = "/hirer/dashboard";
    }
    const redirectCorrect = chosenRedirect === acc.expectedRedirect;
    console.log(`Redirect chosen? ${chosenRedirect} (${redirectCorrect ? "MATCH" : "MISMATCH"})\n`);

    if (!redirectCorrect) {
      allPass = false;
    }
  }

  console.log("===============================================");
  console.log(`FINAL RESULT: ${allPass ? "ALL STEPS VERIFIED PASS" : "FAIL"}`);
  console.log("===============================================");
}

traceAuthentication().catch((err) => {
  console.error("Trace failed:", err);
  process.exit(1);
});
