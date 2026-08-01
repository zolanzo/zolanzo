/**
 * Retry + timeout helpers for AI provider calls.
 */

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = "ai_timeout",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label}:${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function withRetries<T>(params: {
  attempts: number;
  delayMs?: number;
  run: (attempt: number) => Promise<T>;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}): Promise<T> {
  const delayMs = params.delayMs ?? 50;
  let lastError: unknown;
  for (let attempt = 1; attempt <= params.attempts; attempt++) {
    try {
      return await params.run(attempt);
    } catch (error) {
      lastError = error;
      const retry =
        attempt < params.attempts &&
        (params.shouldRetry?.(error, attempt) ?? true);
      if (!retry) break;
      await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "ai_retry_exhausted"));
}
