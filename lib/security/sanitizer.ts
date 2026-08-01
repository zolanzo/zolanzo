export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

export function detectSqlInjection(input: string): boolean {
  if (!input) return false;
  const sqlPatterns = [
    /SELECT\s+.*\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*\s+SET/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
    /UNION\s+ALL\s+SELECT/i,
    /OR\s+1\s*=\s*1/i,
    /AND\s+1\s*=\s*1/i,
    /--;/i,
    /EXEC(\s|\+)+(s|x)p\w+/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

export function verifyOwnership(resourceOwnerId: string, currentUserId: string): boolean {
  if (!resourceOwnerId || !currentUserId) return false;
  return resourceOwnerId === currentUserId;
}

export interface StandardErrorResponse {
  success: false;
  code: string;
  message: string;
  timestamp: string;
}

export function formatStandardError(code: string, message: string): StandardErrorResponse {
  return {
    success: false,
    code,
    message: sanitizeInput(message),
    timestamp: new Date().toISOString(),
  };
}
