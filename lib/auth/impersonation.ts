export interface ImpersonationAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetEmail: string;
  targetName: string;
  targetRole: string;
  reason: string;
  startTime: string;
  endTime?: string;
  actions: {
    timestamp: string;
    type: "PAGE_VIEW" | "ACTION" | "IMPERSONATION_START" | "IMPERSONATION_EXIT";
    path: string;
    details: string;
  }[];
}

export interface ImpersonationSession {
  isActive: boolean;
  adminEmail: string;
  targetId: string;
  targetName: string;
  targetEmail: string;
  targetRole: string;
  reason: string;
  startTime: string;
  logId: string;
}

const STORAGE_KEY_SESSION = "zolanzo_impersonation_session";
const STORAGE_KEY_AUDIT_LOGS = "zolanzo_impersonation_audit_logs_v2";

export function getImpersonationSession(): ImpersonationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAllAuditLogs(): ImpersonationAuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function startImpersonation(
  adminEmail: string,
  targetId: string,
  targetName: string,
  targetEmail: string,
  targetRole: string,
  reason: string
): ImpersonationSession {
  const val = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
  const logId = `audit_${val}`;
  const now = new Date().toISOString();

  const session: ImpersonationSession = {
    isActive: true,
    adminEmail,
    targetId,
    targetName,
    targetEmail,
    targetRole,
    reason,
    startTime: now,
    logId,
  };

  const newAuditRecord: ImpersonationAuditLog = {
    id: logId,
    adminId: "admin_super",
    adminEmail,
    targetId,
    targetEmail,
    targetName,
    targetRole,
    reason,
    startTime: now,
    actions: [
      {
        timestamp: now,
        type: "IMPERSONATION_START",
        path: "/lex/auth",
        details: `Super Admin started impersonating ${targetName} (${targetRole}). Reason: ${reason}`,
      },
    ],
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    const logs = getAllAuditLogs();
    localStorage.setItem(
      STORAGE_KEY_AUDIT_LOGS,
      JSON.stringify([newAuditRecord, ...logs])
    );
  }

  return session;
}

export function logImpersonatedAction(
  type: "PAGE_VIEW" | "ACTION",
  path: string,
  details: string
) {
  const session = getImpersonationSession();
  if (!session || !session.isActive) return;

  const now = new Date().toISOString();
  const logs = getAllAuditLogs();
  const updatedLogs = logs.map((log) => {
    if (log.id === session.logId) {
      return {
        ...log,
        actions: [
          ...log.actions,
          {
            timestamp: now,
            type,
            path,
            details,
          },
        ],
      };
    }
    return log;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updatedLogs));
  }
}

export function exitImpersonation(): ImpersonationAuditLog | null {
  const session = getImpersonationSession();
  if (!session) return null;

  const now = new Date().toISOString();
  const logs = getAllAuditLogs();
  let updatedRecord: ImpersonationAuditLog | null = null;

  const updatedLogs = logs.map((log) => {
    if (log.id === session.logId) {
      updatedRecord = {
        ...log,
        endTime: now,
        actions: [
          ...log.actions,
          {
            timestamp: now,
            type: "IMPERSONATION_EXIT",
            path: typeof window !== "undefined" ? window.location.pathname : "/lex/auth",
            details: `Super Admin ended impersonation session of ${session.targetName}.`,
          },
        ],
      };
      return updatedRecord;
    }
    return log;
  });

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updatedLogs));
  }

  return updatedRecord;
}
