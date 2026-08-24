const UNAVAILABLE_PATTERN =
  /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|fetch failed|tenant\/user .+ not found|getaddrinfo|Can't reach database|P1001|P1017|connection terminated|socket hang up|network|EAI_AGAIN|the remote name could not be resolved/i;

export function isBackendUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.message);
    parts.push(error.name);
    if ("code" in error && error.code != null) {
      parts.push(String(error.code));
    }
  } else if (typeof error === "object") {
    const rec = error as { message?: unknown; code?: unknown; details?: unknown };
    if (rec.message != null) parts.push(String(rec.message));
    if (rec.code != null) parts.push(String(rec.code));
    if (rec.details != null) parts.push(String(rec.details));
    parts.push(String(error));
  } else {
    parts.push(String(error));
  }
  return UNAVAILABLE_PATTERN.test(parts.join(" "));
}
