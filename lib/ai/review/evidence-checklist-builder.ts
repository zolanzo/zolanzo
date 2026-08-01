/**
 * EvidenceChecklistBuilder — required files, blur proxies, metadata, form fields.
 */

import type {
  ReviewChecklistItem,
  ReviewContextBundle,
} from "@/lib/ai/review/review-types";

export type EvidenceChecklistResult = {
  items: ReviewChecklistItem[];
  missingItems: string[];
  completenessScore: number;
};

export function buildEvidenceChecklist(
  ctx: ReviewContextBundle,
): EvidenceChecklistResult {
  const items: ReviewChecklistItem[] = [];
  const missingItems: string[] = [];
  const presentKinds = new Set(
    ctx.evidenceItems.filter((i) => !i.replacedAt).map((i) => i.kind),
  );

  // Required evidence kinds
  for (const kind of ctx.requiredEvidenceKinds) {
    if (presentKinds.has(kind)) {
      items.push({
        code: `evidence.${kind}`,
        label: `Required evidence: ${kind}`,
        status: "pass",
      });
    } else {
      missingItems.push(kind);
      items.push({
        code: `evidence.${kind}`,
        label: `Required evidence: ${kind}`,
        status: "fail",
        detail: "Missing",
      });
    }
  }

  if (ctx.requiredEvidenceKinds.length === 0) {
    items.push({
      code: "evidence.any",
      label: "Evidence attached",
      status: ctx.evidenceItems.some((i) => !i.replacedAt) ? "pass" : "fail",
    });
    if (!ctx.evidenceItems.some((i) => !i.replacedAt)) {
      missingItems.push("any evidence");
    }
  }

  // Blurry / unreadable proxy — very small images
  const tinyImages = ctx.evidenceItems.filter(
    (i) =>
      !i.replacedAt &&
      i.kind === "image" &&
      i.sizeBytes != null &&
      i.sizeBytes < 8_000,
  );
  if (tinyImages.length > 0) {
    items.push({
      code: "evidence.image_quality",
      label: "Image readability",
      status: "warning",
      detail: `${tinyImages.length} image(s) may be blurry/unreadable (small file size)`,
    });
  } else if (presentKinds.has("image")) {
    items.push({
      code: "evidence.image_quality",
      label: "Image readability",
      status: "pass",
    });
  } else {
    items.push({
      code: "evidence.image_quality",
      label: "Image readability",
      status: "skipped",
    });
  }

  // Metadata consistency
  const missingHash = ctx.evidenceItems.filter(
    (i) =>
      !i.replacedAt &&
      !i.contentHash &&
      i.kind !== "text" &&
      i.kind !== "json" &&
      i.kind !== "gps" &&
      i.kind !== "link",
  );
  items.push({
    code: "evidence.metadata",
    label: "File metadata consistency",
    status: missingHash.length > 0 ? "warning" : "pass",
    detail:
      missingHash.length > 0
        ? `${missingHash.length} item(s) missing content hash`
        : undefined,
  });

  // Form fields
  for (const field of ctx.requiredFormFields) {
    if (ctx.presentFormFields.includes(field)) {
      items.push({
        code: `form.${field}`,
        label: `Form field: ${field}`,
        status: "pass",
      });
    } else {
      missingItems.push(field);
      items.push({
        code: `form.${field}`,
        label: `Form field: ${field}`,
        status: "fail",
        detail: "Missing",
      });
    }
  }

  // Completeness
  const relevant = items.filter((i) => i.status !== "skipped");
  const passed = relevant.filter((i) => i.status === "pass").length;
  const completenessScore =
    relevant.length > 0 ? Math.round((passed / relevant.length) * 100) : 100;

  items.push({
    code: "submission.completeness",
    label: "Submission completeness",
    status:
      completenessScore >= 90
        ? "pass"
        : completenessScore >= 60
          ? "warning"
          : "fail",
    detail: `${completenessScore}%`,
  });

  return { items, missingItems, completenessScore };
}
