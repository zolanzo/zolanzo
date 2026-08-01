export type SecurityEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILURE"
  | "AUTH_PIN_CHANGED"
  | "RBAC_ACCESS_DENIED"
  | "FINANCIAL_WITHDRAWAL_ATTEMPT"
  | "FINANCIAL_ESCROW_LOCK"
  | "ADMIN_USER_SUSPENDED"
  | "ADMIN_USER_RESTORED"
  | "SECURITY_ATTACK_BLOCKED";

export interface SecurityAuditEvent {
  id: string;
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  detail: string;
  timestamp: string;
  status: "SUCCESS" | "BLOCKED" | "WARNING";
}

class SecurityAuditLogger {
  private logs: SecurityAuditEvent[] = [];
  private maxLogs = 500;

  public log(event: Omit<SecurityAuditEvent, "id" | "timestamp">): SecurityAuditEvent {
    const entry: SecurityAuditEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    return entry;
  }

  public getLogs(): SecurityAuditEvent[] {
    return [...this.logs];
  }
}

export const securityAudit = new SecurityAuditLogger();
