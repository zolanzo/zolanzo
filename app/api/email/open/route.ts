/**
 * Open-tracking pixel hook (domain-owned).
 * Records open attempt against job idempotency key when present.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("k");
  if (key) {
    try {
      const job = await prisma.notificationJob.findUnique({
        where: { idempotencyKey: key },
        select: { id: true, metadata: true },
      });
      if (job) {
        const meta = (job.metadata ?? {}) as Record<string, unknown>;
        await prisma.notificationJob.update({
          where: { id: job.id },
          data: {
            metadata: {
              ...meta,
              openTracked: true,
              openTrackedAt: new Date().toISOString(),
              openSource: "pixel",
            } as Prisma.InputJsonValue,
          },
        });
      }
    } catch {
      // Never fail the pixel response
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    },
  });
}
