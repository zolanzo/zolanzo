/**
 * Ephemeral copilot session memory — process-local only in 4.1A.
 * Not a domain store; cleared on restart.
 */

import type { CopilotMessage } from "@/lib/ai/types";

type Session = {
  organizationId: string;
  actorUserId: string;
  messages: CopilotMessage[];
  updatedAt: string;
};

const sessions = new Map<string, Session>();
const MAX_MESSAGES = 40;

export function getCopilotSessionId(params: {
  organizationId: string;
  actorUserId: string;
  threadKey?: string;
}): string {
  return `${params.organizationId}:${params.actorUserId}:${params.threadKey ?? "default"}`;
}

export function appendCopilotMemory(
  sessionId: string,
  params: {
    organizationId: string;
    actorUserId: string;
    message: CopilotMessage;
  },
): Session {
  const existing = sessions.get(sessionId) ?? {
    organizationId: params.organizationId,
    actorUserId: params.actorUserId,
    messages: [],
    updatedAt: new Date().toISOString(),
  };
  const messages = [...existing.messages, params.message].slice(-MAX_MESSAGES);
  const next: Session = {
    ...existing,
    messages,
    updatedAt: new Date().toISOString(),
  };
  sessions.set(sessionId, next);
  return next;
}

export function readCopilotMemory(sessionId: string): Session | null {
  return sessions.get(sessionId) ?? null;
}

export function clearCopilotMemory(sessionId: string): void {
  sessions.delete(sessionId);
}

export function resetCopilotMemoryForTests(): void {
  sessions.clear();
}
