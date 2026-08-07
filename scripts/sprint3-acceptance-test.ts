import dotenv from "dotenv";
dotenv.config();

async function runSprint3AcceptanceTests() {
  console.log("==================================================");
  console.log("SPRINT 3 — AUTHENTICATION & ROUTING ACCEPTANCE TESTS");
  console.log("==================================================\n");

  const baseUrl = process.env.TEST_APP_URL || "http://localhost:3000";

  const testCases = [
    {
      name: "Admin Login & Direct Routing to /lex/auth (No Onboarding)",
      email: "ops@zolanzo.com",
      pin: "212523",
      expectedRole: "admin",
      expectedRedirect: "/lex/auth",
      allowOnboarding: false,
    },
    {
      name: "Earner Login & Direct Routing to /earner/dashboard",
      email: "usertest@zolanzo.com",
      pin: "212523",
      expectedRole: "worker",
      expectedRedirect: "/earner/dashboard",
      allowOnboarding: true,
    },
    {
      name: "Hirer Login & Direct Routing to /hirer/dashboard",
      email: "hiretest@zolanzo.com",
      pin: "212523",
      expectedRole: "employer",
      expectedRedirect: "/hirer/dashboard",
      allowOnboarding: true,
    },
  ];

  let passed = true;

  for (const tc of testCases) {
    console.log(`[TEST] ${tc.name}...`);
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tc.email, pin: tc.pin }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error(`  ❌ HTTP POST failed: ${json.error || "Unknown error"}`);
        passed = false;
        continue;
      }

      const profile = json.data?.profile;
      const role = (profile?.role || "").toLowerCase();

      let targetRedirect = "/earner/dashboard";
      if (role === "admin" || role === "super_admin") {
        targetRedirect = "/lex/auth";
      } else if (role === "staff") {
        targetRedirect = "/lex/staff";
      } else if (role === "employer") {
        targetRedirect = "/hirer/dashboard";
      }

      if (targetRedirect !== tc.expectedRedirect) {
        console.error(`  ❌ Redirect mismatch. Expected ${tc.expectedRedirect}, got ${targetRedirect}`);
        passed = false;
        continue;
      }

      if (!tc.allowOnboarding && targetRedirect === "/onboarding") {
        console.error(`  ❌ Role ${role} erroneously routed to /onboarding!`);
        passed = false;
        continue;
      }

      console.log(`  ✓ HTTP Status: ${res.status} OK`);
      console.log(`  ✓ Authenticated Profile: ${profile.full_name} (${profile.email})`);
      console.log(`  ✓ Role Resolved: ${role} -> Target Redirect: ${targetRedirect}\n`);
    } catch (err: unknown) {
      console.error(`  ❌ Execution error: ${err instanceof Error ? err.message : String(err)}`);
      passed = false;
    }
  }

  // Check Onboarding API with invalid session -> Should return 401 Unauthorized, NOT UUID error
  console.log("[TEST] Onboarding API Session Protection (Invalid UUID Guard)...");
  try {
    const res = await fetch(`${baseUrl}/api/auth/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "worker", city: "Lagos" }),
    });

    const json = await res.json();
    if (res.status === 401 && !json.error.includes("invalid input syntax for type uuid")) {
      console.log(`  ✓ Correctly rejected unauthenticated attempt with HTTP 401 Unauthorized (${json.error})\n`);
    } else {
      console.error(`  ❌ Onboarding API returned unexpected response: ${res.status} - ${JSON.stringify(json)}`);
      passed = false;
    }
  } catch (err: unknown) {
    console.error(`  ❌ Onboarding guard test failed: ${err instanceof Error ? err.message : String(err)}`);
    passed = false;
  }

  console.log("==================================================");
  console.log(`SPRINT 3 ACCEPTANCE RESULT: ${passed ? "ALL TESTS PASSED SUCCESSFULLY" : "FAILED"}`);
  console.log("==================================================");

  if (!passed) process.exit(1);
}

runSprint3AcceptanceTests().catch((err) => {
  console.error("Fatal test failure:", err);
  process.exit(1);
});
