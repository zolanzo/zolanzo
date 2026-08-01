/**
 * Sendchamp HTTP client — adapter-only. Domain must never import this.
 * Docs: https://sendchamp.readme.io / https://docs.sendchamp.com
 */

export const SENDCHAMP_API_BASE = "https://api.sendchamp.com/api/v1";

export type SendchampApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; message: string; raw?: unknown };

export function getSendchampApiKey(): string | null {
  const key = process.env.SENDCHAMP_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getSendchampSenderId(): string {
  return process.env.SENDCHAMP_SENDER_ID?.trim() || "Zolanzo";
}

export function getSendchampWhatsappSender(): string | null {
  const v = process.env.SENDCHAMP_WHATSAPP_SENDER?.trim();
  return v && v.length > 0 ? v : null;
}

export function getSendchampWebhookSecret(): string | null {
  const key =
    process.env.SENDCHAMP_WEBHOOK_SECRET?.trim() ||
    process.env.WEBHOOK_SIGNING_SECRET?.trim();
  return key && key.length > 0 ? key : null;
}

export function isSendchampConfigured(): boolean {
  return getSendchampApiKey() !== null;
}

export function isSendchampLiveMode(): boolean {
  return isSendchampConfigured();
}

export type SendchampSmsData = {
  business_id?: string;
  message_id?: string | number;
  uid?: string;
  reference?: string;
  status?: string;
};

export type SendchampWhatsappData = {
  message_id?: string | number;
  uid?: string;
  reference?: string;
  status?: string;
};

export async function sendchampRequest<T>(params: {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<SendchampApiResult<T>> {
  const apiKey = params.apiKey ?? getSendchampApiKey();
  if (!apiKey) {
    return {
      ok: false,
      status: 0,
      message: "SENDCHAMP_API_KEY not configured",
    };
  }

  const fetchFn = params.fetchImpl ?? fetch;
  const url = `${SENDCHAMP_API_BASE}${params.path.startsWith("/") ? params.path : `/${params.path}`}`;
  const timeoutMs = params.timeoutMs ?? 12_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, {
      method: params.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => null)) as
      | {
          status?: string | number;
          message?: string;
          data?: T;
          code?: number;
        }
      | null;

    const okStatus =
      res.ok &&
      (json?.status === 200 ||
        json?.status === "success" ||
        json?.code === 200 ||
        Boolean(json?.data));

    if (!okStatus) {
      return {
        ok: false,
        status: res.status,
        message: json?.message ?? `Sendchamp HTTP ${res.status}`,
        raw: json ?? undefined,
      };
    }

    return {
      ok: true,
      data: (json?.data ?? json) as T,
      status: res.status,
    };
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || /aborted/i.test(error.message));
    return {
      ok: false,
      status: 0,
      message: aborted
        ? `Sendchamp timeout after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : "Sendchamp request failed",
    };
  } finally {
    clearTimeout(timer);
  }
}
