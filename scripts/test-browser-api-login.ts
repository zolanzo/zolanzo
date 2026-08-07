import dotenv from "dotenv";
import { NextRequest } from "next/server";
import { POST } from "../app/api/auth/login/route";

dotenv.config({ path: ".env" });

const ACCOUNTS = [
  { email: "ops@zolanzo.com", pin: "212523", expectedRole: "admin" },
  { email: "usertest@zolanzo.com", pin: "212523", expectedRole: "worker" },
  { email: "hiretest@zolanzo.com", pin: "212523", expectedRole: "employer" },
];

async function testApiLogin() {
  console.log("===============================================");
  console.log("TESTING BROWSER API LOGIN ENDPOINT (POST /api/auth/login)");
  console.log("===============================================\n");

  for (const acc of ACCOUNTS) {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Playwright/Automated-Browser-Test",
      },
      body: JSON.stringify({ email: acc.email, pin: acc.pin }),
    });

    const res = await POST(req);
    const body = await res.json();

    console.log(`[API POST /api/auth/login] ${acc.email}:`);
    console.log(`- Status: ${res.status}`);
    console.log(`- Success: ${body.success}`);
    console.log(`- Profile Role: ${body.data?.profile?.role}`);
    console.log(`- Set-Cookie header present: ${Boolean(res.headers.get("set-cookie"))}\n`);

    if (res.status !== 200 || !body.success || body.data?.profile?.role !== acc.expectedRole) {
      throw new Error(`API Login failed for ${acc.email}`);
    }
  }

  console.log("✓ ALL BROWSER API LOGIN ENDPOINTS VERIFIED SUCCESS (HTTP 200)\n");
}

testApiLogin().catch((err) => {
  console.error("API login test failed:", err);
  process.exit(1);
});
