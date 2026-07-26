import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/app";
import { apiSuccess } from "@/lib/api/response";
import { getLiveHealth } from "@/lib/observability/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness — process is up. Does not require dependencies.
 */
export async function GET() {
  const body = apiSuccess(
    await getLiveHealth({
      version: APP_CONFIG.version,
      name: APP_CONFIG.name,
    }),
  );

  return NextResponse.json(body, { status: 200 });
}
