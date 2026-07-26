import {
  EVIDENCE_STORAGE_ADAPTERS,
  type EvidenceStorageAdapterKey,
} from "@/lib/integrations/types";
import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

const BLOB_KINDS = new Set([
  "image",
  "video",
  "audio",
  "file",
  "screen_recording",
]);

const ADAPTER_SET = new Set<string>(EVIDENCE_STORAGE_ADAPTERS);

export const fileReferenceValidator: Validator = {
  name: "file_reference",
  validate(ctx) {
    const startedAt = Date.now();
    const blobItems = ctx.evidenceSnapshot.filter((i) =>
      BLOB_KINDS.has(i.kind),
    );
    if (blobItems.length === 0) {
      return makeResult({
        name: "file_reference",
        status: "skipped",
        score: null,
        startedAt,
        messages: ["No blob evidence to validate references"],
      });
    }

    const failures: string[] = [];
    for (const item of blobItems) {
      const ref = item.reference;
      if (!ADAPTER_SET.has(ref.adapter)) {
        failures.push(
          `${item.label}: unknown adapter ${String(ref.adapter)}`,
        );
      }
      if (!ref.container?.trim()) {
        failures.push(`${item.label}: missing container`);
      }
      if (!ref.objectKey?.trim()) {
        failures.push(`${item.label}: missing objectKey`);
      }
    }

    if (failures.length > 0) {
      return makeResult({
        name: "file_reference",
        status: "fail",
        score: 0,
        startedAt,
        messages: failures,
      });
    }

    return makeResult({
      name: "file_reference",
      status: "pass",
      score: 100,
      startedAt,
      messages: ["All blob EvidenceReferences are well-formed"],
      metadata: {
        blobCount: blobItems.length,
        adapters: [
          ...new Set(
            blobItems.map((i) => i.reference.adapter as EvidenceStorageAdapterKey),
          ),
        ],
      },
    });
  },
};
