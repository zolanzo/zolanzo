/**
 * Assignment workspace types.
 */

import type {
  AssignmentStatus,
  AssignmentStepStatus,
  AssignmentTimelineEventType,
} from "@/constants/work-states";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";

export type AssignmentPriority = "low" | "normal" | "high" | "urgent";

export type AssignmentRecord = {
  id: string;
  publicId: string;
  taskInstanceId: string;
  campaignId: string;
  workerUserId: string;
  taskTemplateId: string;
  taskTemplateVersion: number;
  reservationId: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  attempts: number;
  maxAttempts: number;
  executionContext: ExecutionContext | null;
  progressPercent: number;
  estimatedRemainingMin: number | null;
  lastActivityAt: string | null;
  pausedAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ReservationRecord = {
  id: string;
  taskInstanceId: string;
  workerUserId: string;
  campaignId: string;
  status: "pending" | "confirmed" | "expired" | "released" | "converted";
  timeoutSeconds: number;
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  expiredAt: string | null;
  convertedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionStepRecord = {
  id: string;
  assignmentId: string;
  sequence: number;
  stepKey: string;
  capability: string;
  instruction: string;
  required: boolean;
  conditionalKey: string | null;
  dependsOnStepKeys: string[];
  estimatedDurationMin: number | null;
  config: Record<string, unknown> | null;
  createdAt: string;
};

export type AssignmentStepRecord = {
  id: string;
  assignmentId: string;
  executionStepId: string;
  status: AssignmentStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  skipReason: string | null;
  failReason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  executionStep?: ExecutionStepRecord;
};

export type AssignmentTimelineRecord = {
  id: string;
  assignmentId: string;
  eventType: AssignmentTimelineEventType;
  payload: Record<string, unknown> | null;
  actorUserId: string | null;
  createdAt: string;
};

export type AssignmentNoteRecord = {
  id: string;
  assignmentId: string;
  authorUserId: string;
  visibility: "worker_private" | "reviewer_placeholder";
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type AssignmentProgress = {
  progressPercent: number;
  completedSteps: number;
  requiredSteps: number;
  requiredCompleted: number;
  optionalCompleted: number;
  totalSteps: number;
  estimatedRemainingMin: number | null;
  startedAt: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
  readyForSubmission: boolean;
};

export type AssignmentWorkspace = {
  assignment: AssignmentRecord;
  overview: {
    title: string;
    category: string;
    objective: string;
    description: string;
    campaignPublicId: string;
    templatePublicId: string;
    templateName: string;
    rewardPerUnitMinor: number;
    currency: string;
  };
  instructions: {
    workerInstructions: string;
    qualityExpectations: string;
    acceptableExamples: string[];
    unacceptableExamples: string[];
  };
  executionSteps: ExecutionStepRecord[];
  checklist: AssignmentStepRecord[];
  progress: AssignmentProgress;
  timeline: AssignmentTimelineRecord[];
  notes: AssignmentNoteRecord[];
  evidencePlaceholder: {
    requiredKinds: string[];
    message: string;
  };
  audit: {
    executionContext: ExecutionContext | null;
    reservationId: string;
    taskInstanceId: string;
  };
};
