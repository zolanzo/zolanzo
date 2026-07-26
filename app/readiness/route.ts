import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/app";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getReadinessHealth } from "@/lib/observability/probes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Readiness — can this instance take traffic?
 */
export async function GET() {
  const report = await getReadinessHealth({
    version: APP_CONFIG.version,
    name: APP_CONFIG.name,
  });

  const status =
    report.status === "ok" ? 200 : report.status === "degraded" ? 200 : 503;

  if (report.status === "down") {
    return NextResponse.json(
      apiError("NOT_READY", "Application is not ready", {
        report,
      }),
      { status },
    );
  }

  return NextResponse.json(apiSuccess(report), { status });
}
