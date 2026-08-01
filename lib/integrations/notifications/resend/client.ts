/**
 * Resend HTTP client — adapter-only. Domain must never import this.
 */

export const RESEND_API_BASE = "https://api.resend.com";

export type ResendApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; message: string; raw?: unknown };

export function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Zolanzo <onboarding@resend.dev>"
  );
}

export function getResendWebhookSecret(): string | null {
  const key = process.env.RESEND_WEBHOOK_SECRET?.trim();
  return key && key.length > 0 ? key : null;
}

export function isResendConfigured(): boolean {
  return getResendApiKey() !== null;
}

export function isResendLiveMode(): boolean {
  return isResendConfigured();
}

export type ResendSendEmailData = {
  id: string;
};

export async function resendRequest<T>(params: {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<ResendApiResult<T>> {
  const apiKey = params.apiKey ?? getResendApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, message: "RESEND_API_KEY not configured" };
  }

  const fetchFn = params.fetchImpl ?? fetch;
  const url = `${RESEND_API_BASE}${params.path.startsWith("/") ? params.path : `/${params.path}`}`;

  try {
    const res = await fetchFn(url, {
      method: params.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
    });

    const json = (await res.json().catch(() => null)) as
      | (T & { message?: string; name?: string })
      | { message?: string; name?: string; statusCode?: number }
      | null;

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message:
          (json && "message" in json && json.message) ||
          `Resend HTTP ${res.status}`,
        raw: json ?? undefined,
      };
    }

    return { ok: true, data: json as T, status: res.status };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Resend request failed",
    };
  }
}
