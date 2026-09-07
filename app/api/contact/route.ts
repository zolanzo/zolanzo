import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { submitContactMessage } from "@/lib/contact/submit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const limited = checkRateLimit(`contact_${ip}`, 5, 900);
  if (!limited.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMIT", message: "Something went wrong. Please try again." } },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID", message: "Something went wrong. Please try again." } },
      { status: 400 },
    );
  }

  const result = await submitContactMessage(body);
  const status = result.ok ? 200 : result.error.code === "RATE_LIMIT" ? 429 : 400;
  return NextResponse.json(result, { status });
}
