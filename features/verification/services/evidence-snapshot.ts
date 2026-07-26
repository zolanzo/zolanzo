/**
 * Capture immutable evidence snapshot for validation.
 */

import type { EvidenceItemRecord } from "@/features/submissions/types";
import type { EvidenceSnapshotItem } from "@/features/verification/types";

export function captureEvidenceSnapshot(
  items: EvidenceItemRecord[],
): EvidenceSnapshotItem[] {
  return items.map((item) => ({
    evidenceItemId: item.id,
    kind: item.kind,
    label: item.label,
    stepKey: item.stepKey,
    reference: { ...item.reference },
    contentHash: item.contentHash,
    sizeBytes: item.sizeBytes,
    inlinePayload:
      item.inlinePayload === null
        ? null
        : typeof item.inlinePayload === "string"
          ? item.inlinePayload
          : { ...item.inlinePayload },
    metadata: item.metadata ? { ...item.metadata } : null,
    createdAt: item.createdAt,
  }));
}
