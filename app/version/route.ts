import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/config/app";
import { resolveAppEnvironment } from "@/config/environments";
import { apiSuccess } from "@/lib/api/response";
import { getEnv } from "@/lib/validation/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Build / app version metadata.
 */
export async function GET() {
  const env = getEnv();

  return NextResponse.json(
    apiSuccess({
      name: APP_CONFIG.name,
      version: APP_CONFIG.version,
      environment: resolveAppEnvironment(env.ZOLANZO_ENV),
      nodeEnv: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }),
  );
}
