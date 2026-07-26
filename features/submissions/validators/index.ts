import { z } from "zod";
import {
  MANIFEST_EVIDENCE_KINDS,
  SUBMISSION_STATUSES,
} from "@/constants/work-states";
import { EVIDENCE_STORAGE_ADAPTERS } from "@/lib/integrations/types";

export const evidenceReferenceSchema = z.object({
  adapter: z.enum(
    EVIDENCE_STORAGE_ADAPTERS as unknown as [string, ...string[]],
  ),
  container: z.string().min(1).max(128),
  objectKey: z.string().min(1).max(512),
  contentType: z.string().max(128).optional(),
});

export const createDraftSubmissionSchema = z.object({
  assignmentPublicId: z.string().min(1),
  deviceSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  gpsSnapshot: z.record(z.string(), z.unknown()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const attachEvidenceSchema = z.object({
  submissionPublicId: z.string().min(1),
  kind: z.enum(MANIFEST_EVIDENCE_KINDS as unknown as [string, ...string[]]),
  label: z.string().min(1).max(200),
  stepKey: z.string().max(64).optional(),
  /** Base64 body for blob kinds — stored via evidence adapter */
  bodyBase64: z.string().optional(),
  contentType: z.string().max(128).optional(),
  /** Inline for text/json/gps/link without blob storage */
  inlinePayload: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const replaceEvidenceSchema = attachEvidenceSchema.extend({
  evidenceItemId: z.string().min(1),
});

export const removeEvidenceSchema = z.object({
  submissionPublicId: z.string().min(1),
  evidenceItemId: z.string().min(1),
});

export const markSubmissionReadySchema = z.object({
  submissionPublicId: z.string().min(1),
});

export const submitPackageSchema = z.object({
  submissionPublicId: z.string().min(1),
});

export const submissionStatusSchema = z.enum(
  SUBMISSION_STATUSES as unknown as [string, ...string[]],
);

export type CreateDraftSubmissionInput = z.infer<
  typeof createDraftSubmissionSchema
>;
export type AttachEvidenceInput = z.infer<typeof attachEvidenceSchema>;
