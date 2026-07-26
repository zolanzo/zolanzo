/**
 * Reusable retry policies for jobs and adapters.
 * Observability / reliability only — no domain logic.
 */

export type BackoffStrategy = "immediate" | "fixed" | "exponential";

export type RetryPolicy = {
  /** Max attempts including the first try */
  maxAttempts: number;
  strategy: BackoffStrategy;
  /** Base delay in ms (ignored for immediate) */
  baseDelayMs: number;
  /** Cap delay in ms */
  maxDelayMs: number;
  /** Add randomized jitter (± fraction of delay) */
  jitter: boolean;
  /** Hint for dead-letter routing when exhausted */
  deadLetterReady: boolean;
};

export const RETRY_POLICIES = {
  immediate: {
    maxAttempts: 3,
    strategy: "immediate",
    baseDelayMs: 0,
    maxDelayMs: 0,
    jitter: false,
    deadLetterReady: true,
  },
  exponential: {
    maxAttempts: 5,
    strategy: "exponential",
    baseDelayMs: 1_000,
    maxDelayMs: 60_000,
    jitter: true,
    deadLetterReady: true,
  },
  finance: {
    maxAttempts: 3,
    strategy: "exponential",
    baseDelayMs: 2_000,
    maxDelayMs: 30_000,
    jitter: true,
    deadLetterReady: true,
  },
  notifications: {
    maxAttempts: 5,
    strategy: "exponential",
    baseDelayMs: 5_000,
    maxDelayMs: 120_000,
    jitter: true,
    deadLetterReady: true,
  },
} as const satisfies Record<string, RetryPolicy>;

export type RetryPolicyName = keyof typeof RETRY_POLICIES;

export function resolveRetryPolicy(
  nameOrPolicy: RetryPolicyName | RetryPolicy,
): RetryPolicy {
  if (typeof nameOrPolicy === "string") {
    return { ...RETRY_POLICIES[nameOrPolicy] };
  }
  return { ...nameOrPolicy };
}

/**
 * Delay before the next attempt after `attempt` failed tries (1-based after first failure).
 * attempt=1 → delay after first failure.
 */
export function computeRetryDelayMs(
  policy: RetryPolicy,
  attempt: number,
): number {
  if (policy.strategy === "immediate" || policy.baseDelayMs <= 0) {
    return 0;
  }

  let delay =
    policy.strategy === "fixed"
      ? policy.baseDelayMs
      : policy.baseDelayMs * 2 ** Math.max(0, attempt - 1);

  delay = Math.min(delay, policy.maxDelayMs);

  if (policy.jitter && delay > 0) {
    const spread = delay * 0.2;
    delay = Math.max(0, delay + (Math.random() * 2 - 1) * spread);
  }

  return Math.round(delay);
}

export function isRetryExhausted(
  policy: RetryPolicy,
  attemptsMade: number,
): boolean {
  return attemptsMade >= policy.maxAttempts;
}

export type RetryOutcome<T> =
  | { ok: true; value: T; attempts: number }
  | {
      ok: false;
      error: unknown;
      attempts: number;
      deadLetterReady: boolean;
    };

/**
 * Run `fn` with retries according to policy.
 * Caller should keep work idempotent.
 */
export async function withRetry<T>(
  policyInput: RetryPolicyName | RetryPolicy,
  fn: (attempt: number) => Promise<T>,
  opts?: {
    sleep?: (ms: number) => Promise<void>;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  },
): Promise<RetryOutcome<T>> {
  const policy = resolveRetryPolicy(policyInput);
  const sleep =
    opts?.sleep ??
    ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const shouldRetry = opts?.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      const value = await fn(attempt);
      return { ok: true, value, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (
        attempt >= policy.maxAttempts ||
        !shouldRetry(error, attempt)
      ) {
        break;
      }
      const delay = computeRetryDelayMs(policy, attempt);
      if (delay > 0) await sleep(delay);
    }
  }

  return {
    ok: false,
    error: lastError,
    attempts: policy.maxAttempts,
    deadLetterReady: policy.deadLetterReady,
  };
}
