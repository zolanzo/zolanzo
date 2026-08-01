/**
 * AI audit log — advisory invocations only (no domain writes).
 */

export type AiAuditEntry = {
  at: string;
  correlationId: string | null;
  provider: string;
  promptKey: string;
  organizationId: string | null;
  actorUserId: string | null;
  success: boolean;
  latencyMs: number;
  totalTokens: number;
  costMicroUsd: number;
  stub: boolean;
  errorCode?: string;
};

const auditLog: AiAuditEntry[] = [];
const MAX = 500;

export function appendAiAudit(entry: AiAuditEntry): void {
  auditLog.push(entry);
  if (auditLog.length > MAX) auditLog.shift();
}

export function listAiAudit(limit = 50): AiAuditEntry[] {
  return auditLog.slice(-limit).reverse();
}

export function resetAiAuditForTests(): void {
  auditLog.length = 0;
}
