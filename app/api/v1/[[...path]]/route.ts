/**
 * Public API v1 catch-all — sole external HTTP entry for /api/v1/*.
 */

import { NextRequest, NextResponse } from "next/server";
import { handlePublicApiRequest } from "@/lib/public-api/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function dispatch(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const { path: segments } = await context.params;
  const path = `/${(segments ?? []).join("/")}`;
  let body: unknown = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
  }

  const result = await handlePublicApiRequest({
    method: request.method,
    path,
    headers: request.headers,
    query: request.nextUrl.searchParams,
    body,
  });

  return NextResponse.json(result.body, {
    status: result.status,
    headers: result.headers,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return dispatch(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return dispatch(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return dispatch(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return dispatch(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return dispatch(request, context);
}
