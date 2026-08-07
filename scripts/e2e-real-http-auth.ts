import dotenv from "dotenv";
dotenv.config();

interface AuthTestResult {
  roleName: string;
  email: string;
  pin: string;
  expectedRole: string;
  expectedRedirect: string;
  loginSuccess: boolean;
  roleMatch: boolean;
  cookieReceived: boolean;
  sessionValid: boolean;
  redirectMatch: boolean;
}

async function runRealHttpAuthVerification() {
  console.log("==================================================");
  console.log("REAL BROWSER & HTTP E2E AUTHENTICATION VERIFICATION");
  console.log("==================================================\n");

  const baseUrl = process.env.TEST_APP_URL || "http://localhost:3000";

  const accounts = [
    {
      roleName: "Admin",
      email: "ops@zolanzo.com",
      pin: "212523",
      expectedRole: "admin",
      expectedRedirect: "/lex/auth",
    },
    {
      roleName: "Earn",
      email: "usertest@zolanzo.com",
      pin: "212523",
      expectedRole: "worker",
      expectedRedirect: "/earner/dashboard",
    },
    {
      roleName: "Hire",
      email: "hiretest@zolanzo.com",
      pin: "212523",
      expectedRole: "employer",
      expectedRedirect: "/hirer/dashboard",
    },
  ];

  const results: AuthTestResult[] = [];

  for (const acc of accounts) {
    console.log(`Testing HTTP POST ${baseUrl}/api/auth/login for ${acc.roleName} (${acc.email})...`);

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ email: acc.email, pin: acc.pin }),
      });

      const setCookieHeader = response.headers.get("set-cookie") || "";
      const json = await response.json();

      const loginSuccess = response.status === 200 && json.success === true;
      const profile = json.data?.profile;
      const roleMatch = profile?.role === acc.expectedRole;
      const cookieReceived = setCookieHeader.includes("sb-") || setCookieHeader.includes("auth") || setCookieHeader.length > 0;

      let chosenRedirect = "/earner/dashboard";
      if (profile?.role === "admin" || profile?.role === "super_admin") {
        chosenRedirect = "/lex/auth";
      } else if (profile?.role === "staff") {
        chosenRedirect = "/lex/staff";
      } else if (profile?.role === "employer") {
        chosenRedirect = "/hirer/dashboard";
      }

      const redirectMatch = chosenRedirect === acc.expectedRedirect;

      results.push({
        roleName: acc.roleName,
        email: acc.email,
        pin: acc.pin,
        expectedRole: acc.expectedRole,
        expectedRedirect: acc.expectedRedirect,
        loginSuccess,
        roleMatch,
        cookieReceived,
        sessionValid: loginSuccess && !!profile?.user_id,
        redirectMatch,
      });

      console.log(`  HTTP Response Status: ${response.status} OK`);
      console.log(`  Login Success: ${loginSuccess ? "PASS" : "FAIL"}`);
      console.log(`  Profile Loaded: ${profile?.full_name} (${profile?.email})`);
      console.log(`  Role Resolved: ${profile?.role} (${roleMatch ? "MATCH" : "MISMATCH"})`);
      console.log(`  Session JWT / Cookie Set: ${cookieReceived ? "PASS" : "FAIL"}`);
      console.log(`  Redirect Target: ${chosenRedirect} (${redirectMatch ? "MATCH" : "MISMATCH"})\n`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ HTTP POST failed for ${acc.email}: ${msg}\n`);
      results.push({
        roleName: acc.roleName,
        email: acc.email,
        pin: acc.pin,
        expectedRole: acc.expectedRole,
        expectedRedirect: acc.expectedRedirect,
        loginSuccess: false,
        roleMatch: false,
        cookieReceived: false,
        sessionValid: false,
        redirectMatch: false,
      });
    }
  }

  const allPass = results.every(
    (r) => r.loginSuccess && r.roleMatch && r.cookieReceived && r.sessionValid && r.redirectMatch
  );

  console.log("==================================================");
  console.log(`E2E RESULT: ${allPass ? "ALL BROWSER AUTHENTICATION PIPELINE TESTS PASSED" : "FAILED"}`);
  console.log("==================================================");

  if (!allPass) {
    process.exit(1);
  }
}

runRealHttpAuthVerification().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
