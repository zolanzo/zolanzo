/**
 * Worker PermissionFilter — self-only access; no other workers / org-private data.
 */

import type { WorkerCopilotIntent } from "@/lib/ai/copilot/worker-types";
import type { Permission } from "@/constants/permissions";

export type WorkerCopilotAuthContext = {
  actorUserId: string;
  /** Must equal the worker whose facts are loaded */
  workerUserId: string;
  permissions: readonly Permission[];
};

const INTENT_PERMISSIONS: Record<WorkerCopilotIntent, Permission[]> = {
  my_assignments: ["assignments.read"],
  next_best_task: ["assignments.read"],
  highest_pay_today: ["assignments.read"],
  nearby_work: ["assignments.read"],
  deadlines: ["assignments.read"],
  submission_status: ["assignments.read", "submissions.create"],
  missing_evidence: ["assignments.read", "submissions.create"],
  rejection_reason: ["assignments.read", "submissions.create"],
  approval_history: ["assignments.read"],
  trust_score: ["workers.profile.read"],
  weekly_earnings: ["wallet.read"],
  payment_history: ["wallet.read"],
  assignment_coach: ["assignments.read", "submissions.create"],
  progress: ["assignments.read"],
  improvement_tips: ["assignments.read", "workers.profile.read"],
  follow_up: ["assignments.read"],
  unknown: ["assignments.read"],
};

export function requiredPermissionsForWorkerIntent(
  intent: WorkerCopilotIntent,
): Permission[] {
  return INTENT_PERMISSIONS[intent] ?? ["assignments.read"];
}

/**
 * Worker may only query their own facts. Actor must match workerUserId.
 */
export function canAccessWorkerCopilotIntent(
  auth: WorkerCopilotAuthContext,
  intent: WorkerCopilotIntent,
): boolean {
  if (!auth.actorUserId || !auth.workerUserId) return false;
  if (auth.actorUserId !== auth.workerUserId) return false;
  const required = requiredPermissionsForWorkerIntent(intent);
  return required.some((p) => auth.permissions.includes(p));
}
