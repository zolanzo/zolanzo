/**
 * Map template evidence onto submission manifest kinds.
 * Does not invent proof types beyond the template / capability catalog.
 */

import {
  evidenceKindsForCapabilities,
  type EvidenceKind,
  type WorkCapability,
} from "@/constants/work-capabilities";
import {
  MANIFEST_EVIDENCE_KINDS,
  type ManifestEvidenceKind,
} from "@/constants/work-states";
import type { EvidenceRequirement } from "@/features/task-templates/types";
import type { TemplateStepDefinition } from "@/features/task-templates/types";

const EVIDENCE_TO_MANIFEST: Record<EvidenceKind, ManifestEvidenceKind | null> = {
  text: "text",
  file: "file",
  image: "image",
  video: "video",
  audio: "audio",
  link: "link",
  json: "json",
  location: "gps",
  screen_recording: "screen_recording",
  logs: "text",
  rating: "json",
  custom: "text",
};

export type WorkProofField = {
  kind: ManifestEvidenceKind;
  label: string;
  required: boolean;
  stepKey?: string;
};

export function toManifestEvidenceKind(
  kind: EvidenceKind,
): ManifestEvidenceKind | null {
  const mapped = EVIDENCE_TO_MANIFEST[kind];
  if (!mapped) return null;
  if (!(MANIFEST_EVIDENCE_KINDS as readonly string[]).includes(mapped)) {
    return null;
  }
  return mapped;
}

export function proofFieldsFromTemplate(params: {
  requiredEvidence: EvidenceRequirement[] | null | undefined;
  capabilitySet: TemplateStepDefinition[] | null | undefined;
}): WorkProofField[] {
  const required = params.requiredEvidence ?? [];
  const fromTemplate: WorkProofField[] = [];
  for (const item of required) {
    const kind = toManifestEvidenceKind(item.kind);
    if (!kind) continue;
    fromTemplate.push({
      kind,
      label: item.stepKey ? `${item.kind} (${item.stepKey})` : item.kind,
      required: item.required,
      stepKey: item.stepKey,
    });
  }
  if (fromTemplate.length > 0) return fromTemplate;

  const capabilities = (params.capabilitySet ?? [])
    .filter((step) => step.required)
    .map((step) => step.capability as WorkCapability);
  const kinds = evidenceKindsForCapabilities(capabilities);
  const seen = new Set<ManifestEvidenceKind>();
  const fromCapabilities: WorkProofField[] = [];
  for (const kind of kinds) {
    const mapped = toManifestEvidenceKind(kind);
    if (!mapped || seen.has(mapped)) continue;
    seen.add(mapped);
    fromCapabilities.push({
      kind: mapped,
      label: mapped,
      required: true,
    });
  }
  return fromCapabilities;
}

export function isInlineProofKind(kind: ManifestEvidenceKind): boolean {
  return kind === "text" || kind === "json" || kind === "gps" || kind === "link";
}
