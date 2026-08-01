/**
 * Public API audit trail.
 */

type AuditEntry = {
  id: string;
  requestId: string;
  principalId: string;
  method: string;
  path: string;
  status: number;
  scope: string | null;
  createdAt: string;
};

const entries: AuditEntry[] = [];
let seq = 0;

export function resetPublicApiAuditForTests(): void {
  entries.length = 0;
  seq = 0;
}

export function recordPublicApiAudit(input: {
  requestId: string;
  principalId: string;
  method: string;
  path: string;
  status: number;
  scope?: string | null;
}): void {
  seq += 1;
  entries.push({
    id: `paud_${seq.toString(36)}`,
    requestId: input.requestId,
    principalId: input.principalId,
    method: input.method,
    path: input.path,
    status: input.status,
    scope: input.scope ?? null,
    createdAt: new Date().toISOString(),
  });
}

export function listPublicApiAudit(limit = 100): AuditEntry[] {
  return entries.slice(-limit).reverse();
}

export function countPublicApiAudit(): number {
  return entries.length;
}
