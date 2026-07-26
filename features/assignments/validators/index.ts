import { z } from "zod";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STEP_STATUSES,
} from "@/constants/work-states";
import { workerContextSchema } from "@/features/task-marketplace/validators";

export const startAssignmentSchema = z.object({
  assignmentPublicId: z.string().min(1),
});

export const pauseAssignmentSchema = z.object({
  assignmentPublicId: z.string().min(1),
});

export const resumeAssignmentSchema = z.object({
  assignmentPublicId: z.string().min(1),
});

export const markReadyForSubmissionSchema = z.object({
  assignmentPublicId: z.string().min(1),
});

export const transitionChecklistSchema = z.object({
  assignmentPublicId: z.string().min(1),
  assignmentStepId: z.string().min(1),
  to: z.enum(ASSIGNMENT_STEP_STATUSES as unknown as [string, ...string[]]),
  skipReason: z.string().max(1000).optional(),
  failReason: z.string().max(1000).optional(),
});

export const addAssignmentNoteSchema = z.object({
  assignmentPublicId: z.string().min(1),
  body: z.string().min(1).max(8000),
  visibility: z
    .enum(["worker_private", "reviewer_placeholder"])
    .default("worker_private"),
});

export const getWorkspaceSchema = z.object({
  assignmentPublicId: z.string().min(1),
});

export const transitionAssignmentSchema = z.object({
  assignmentPublicId: z.string().min(1),
  to: z.enum(ASSIGNMENT_STATUSES as unknown as [string, ...string[]]),
});

export const hydrateClaimContextSchema = workerContextSchema.partial().extend({
  userId: z.string().min(1),
});

export type TransitionChecklistInput = z.infer<typeof transitionChecklistSchema>;
export type AddAssignmentNoteInput = z.infer<typeof addAssignmentNoteSchema>;
