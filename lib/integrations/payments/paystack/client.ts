/**
 * Paystack HTTP client — adapter-only. Domain must never import this.
 * Live calls require PAYSTACK_SECRET_KEY. No keys → callers stay in stub mode.
 */

export const PAYSTACK_API_BASE = "https://api.paystack.co";

export type PaystackApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; message: string; raw?: unknown };

export function getPaystackSecretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getPaystackPublicKey(): string | null {
  const key = process.env.PAYSTACK_PUBLIC_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isPaystackConfigured(): boolean {
  return getPaystackSecretKey() !== null;
}

/** Live mode only when secret is present. Test/stub otherwise. */
export function isPaystackLiveMode(): boolean {
  return isPaystackConfigured();
}

export async function paystackRequest<T>(params: {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  secretKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<PaystackApiResult<T>> {
  const secret = params.secretKey ?? getPaystackSecretKey();
  if (!secret) {
    return { ok: false, status: 0, message: "PAYSTACK_SECRET_KEY not configured" };
  }

  const fetchFn = params.fetchImpl ?? fetch;
  const url = `${PAYSTACK_API_BASE}${params.path.startsWith("/") ? params.path : `/${params.path}`}`;

  try {
    const res = await fetchFn(url, {
      method: params.method,
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: params.body ? JSON.stringify(params.body) : undefined,
    });

    const json = (await res.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: T }
      | null;

    if (!res.ok || !json || json.status !== true) {
      return {
        ok: false,
        status: res.status,
        message: json?.message ?? `Paystack HTTP ${res.status}`,
        raw: json ?? undefined,
      };
    }

    return { ok: true, data: json.data as T, status: res.status };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Paystack request failed",
    };
  }
}

export type PaystackInitializeData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerifyData = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  created_at?: string;
  channel?: string;
  metadata?: Record<string, unknown> | null;
  customer?: { email?: string; customer_code?: string };
  gateway_response?: string;
};

export type PaystackRefundData = {
  id: number;
  transaction?: { reference?: string; id?: number };
  amount: number;
  currency: string;
  status: string;
  refunded_at?: string | null;
};

export type PaystackTransactionListItem = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  created_at?: string;
};
