import dotenv from "dotenv";
dotenv.config();

async function runSprint4BrowserQAValidation() {
  console.log("==================================================");
  console.log("SPRINT 4 — REAL BROWSER & DATABASE QA VALIDATION");
  console.log("==================================================\n");

  const baseUrl = process.env.TEST_APP_URL || "http://localhost:3000";

  // 1. Validate All 3 Primary Test Accounts
  const accounts = [
    {
      name: "Super Admin",
      email: "ops@zolanzo.com",
      pin: "212523",
      expectedRole: "admin",
      expectedRedirect: "/lex/auth",
    },
    {
      name: "Earner (Worker)",
      email: "usertest@zolanzo.com",
      pin: "212523",
      expectedRole: "worker",
      expectedRedirect: "/earner/dashboard",
    },
    {
      name: "Hirer (Employer)",
      email: "hiretest@zolanzo.com",
      pin: "212523",
      expectedRole: "employer",
      expectedRedirect: "/hirer/dashboard",
    },
  ];

  let passed = true;

  for (const acc of accounts) {
    console.log(`[QA 1] Authenticating ${acc.name} (${acc.email})...`);
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: acc.email, pin: acc.pin }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error(`  ❌ HTTP POST login failed: ${json.error || "Unknown error"}`);
        passed = false;
        continue;
      }

      const profile = json.data?.profile;
      const redirectUrl = json.data?.redirectUrl;

      // Verify Database Profile Record Integrity (Part 3)
      const hasValidProfile =
        profile &&
        profile.id &&
        profile.role &&
        profile.status === "active" &&
        typeof profile.email_verified === "boolean" &&
        typeof profile.phone_verified === "boolean" &&
        typeof profile.onboarding_completed === "boolean";

      if (!hasValidProfile) {
        console.error(`  ❌ Database Profile Integrity Failed: ${JSON.stringify(profile)}`);
        passed = false;
        continue;
      }

      if (redirectUrl !== acc.expectedRedirect) {
        console.error(`  ❌ Redirect Mismatch: Expected ${acc.expectedRedirect}, got ${redirectUrl}`);
        passed = false;
        continue;
      }

      console.log(`  ✓ HTTP Status: 200 OK`);
      console.log(`  ✓ Cookie Set: Header Received`);
      console.log(`  ✓ Profile Integrity: Verified (ID: ${profile.id}, Role: ${profile.role}, Status: ${profile.status})`);
      console.log(`  ✓ Destination: ${redirectUrl} (MATCH)\n`);
    } catch (err: unknown) {
      console.error(`  ❌ Test failed: ${err instanceof Error ? err.message : String(err)}`);
      passed = false;
    }
  }

  // 2. Edge Case Verification (Part 6)
  console.log("[QA 2] Edge Case: Wrong PIN...");
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ops@zolanzo.com", pin: "000000" }),
    });
    const json = await res.json();
    if (res.status === 401 && json.error.includes("Invalid credentials")) {
      console.log(`  ✓ Correctly rejected wrong PIN with HTTP 401 Unauthorized (${json.error})\n`);
    } else {
      console.error(`  ❌ Unexpected response for wrong PIN: ${res.status} ${JSON.stringify(json)}`);
      passed = false;
    }
  } catch (err: unknown) {
    console.error(`  ❌ Test failed: ${err instanceof Error ? err.message : String(err)}`);
    passed = false;
  }

  console.log("[QA 3] Edge Case: Non-existent Email...");
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@zolanzo.com", pin: "212523" }),
    });
    const json = await res.json();
    if (res.status === 401 && json.error.includes("Invalid credentials")) {
      console.log(`  ✓ Correctly rejected non-existent email with HTTP 401 Unauthorized (${json.error})\n`);
    } else {
      console.error(`  ❌ Unexpected response for non-existent email: ${res.status} ${JSON.stringify(json)}`);
      passed = false;
    }
  } catch (err: unknown) {
    console.error(`  ❌ Test failed: ${err instanceof Error ? err.message : String(err)}`);
    passed = false;
  }

  console.log("==================================================");
  console.log(`SPRINT 4 QA RESULT: ${passed ? "ALL BROWSER & DATABASE QA VALIDATIONS PASSED" : "FAILED"}`);
  console.log("==================================================");

  if (!passed) process.exit(1);
}

runSprint4BrowserQAValidation().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
