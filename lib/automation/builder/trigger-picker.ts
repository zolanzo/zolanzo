/**
 * TriggerPicker — schema-driven trigger catalog for the Visual Rule Builder.
 */

import { listTriggers, getTrigger } from "@/lib/automation/trigger-registry";
import type { AutomationTriggerType } from "@/lib/automation/types";
import { listTemplates } from "@/lib/automation/library/template-registry";
import type {
  BuilderTriggerCategory,
  TriggerCatalogEntry,
} from "@/lib/automation/builder/types";

const TRIGGER_CATEGORY: Record<AutomationTriggerType, BuilderTriggerCategory> =
  {
    "assignment.accepted": "assignments",
    "assignment.completed": "assignments",
    "submission.approved": "reviews",
    "submission.rejected": "reviews",
    "campaign.created": "campaigns",
    "payment.settled": "payments",
    "trust.updated": "trust",
    "forecast.generated": "forecasts",
    "report.generated": "reports",
    "worker.registered": "workers",
  };

const TRIGGER_PERMISSIONS: Record<AutomationTriggerType, string[]> = {
  "assignment.accepted": ["analytics.read"],
  "assignment.completed": ["analytics.read"],
  "submission.approved": ["analytics.read"],
  "submission.rejected": ["analytics.admin"],
  "campaign.created": ["analytics.read"],
  "payment.settled": ["analytics.admin"],
  "trust.updated": ["analytics.read"],
  "forecast.generated": ["analytics.read"],
  "report.generated": ["analytics.read"],
  "worker.registered": ["analytics.read"],
};

const TRIGGER_NAMES: Record<AutomationTriggerType, string> = {
  "assignment.accepted": "Assignment accepted",
  "assignment.completed": "Assignment completed",
  "submission.approved": "Submission approved",
  "submission.rejected": "Submission rejected",
  "campaign.created": "Campaign created",
  "payment.settled": "Payment settled",
  "trust.updated": "Trust updated",
  "forecast.generated": "Forecast generated",
  "report.generated": "Report generated",
  "worker.registered": "Worker registered",
};

function compatibleTemplates(trigger: AutomationTriggerType): string[] {
  try {
    return listTemplates()
      .filter((t) => t.trigger === trigger)
      .map((t) => t.id);
  } catch {
    return [];
  }
}

export function listTriggerCatalog(): TriggerCatalogEntry[] {
  return listTriggers().map((t) => ({
    type: t.type,
    name: TRIGGER_NAMES[t.type],
    description: t.description,
    category: TRIGGER_CATEGORY[t.type],
    payloadFields: t.payloadFields,
    requiredPermissions: TRIGGER_PERMISSIONS[t.type],
    compatibleTemplateIds: compatibleTemplates(t.type),
  }));
}

export function listTriggersByCategory(): Record<
  BuilderTriggerCategory,
  TriggerCatalogEntry[]
> {
  const grouped = Object.fromEntries(
    (
      [
        "assignments",
        "reviews",
        "campaigns",
        "payments",
        "trust",
        "analytics",
        "forecasts",
        "reports",
        "organizations",
        "workers",
      ] as BuilderTriggerCategory[]
    ).map((c) => [c, [] as TriggerCatalogEntry[]]),
  ) as Record<BuilderTriggerCategory, TriggerCatalogEntry[]>;

  for (const entry of listTriggerCatalog()) {
    grouped[entry.category].push(entry);
  }
  return grouped;
}

export function getTriggerCatalogEntry(
  type: AutomationTriggerType,
): TriggerCatalogEntry | undefined {
  const def = getTrigger(type);
  if (!def) return undefined;
  return {
    type: def.type,
    name: TRIGGER_NAMES[def.type],
    description: def.description,
    category: TRIGGER_CATEGORY[def.type],
    payloadFields: def.payloadFields,
    requiredPermissions: TRIGGER_PERMISSIONS[def.type],
    compatibleTemplateIds: compatibleTemplates(def.type),
  };
}

export function samplePayloadForTrigger(
  type: AutomationTriggerType,
): Record<string, unknown> {
  const entry = getTriggerCatalogEntry(type);
  const payload: Record<string, unknown> = {};
  for (const field of entry?.payloadFields ?? []) {
    switch (field) {
      case "trustScore":
      case "confidence":
      case "amountMinor":
        payload[field] = 50;
        break;
      case "trend":
        payload[field] = "stable";
        break;
      case "paymentStatus":
        payload[field] = "completed";
        break;
      case "region":
        payload[field] = "Lagos";
        break;
      default:
        payload[field] = `sample_${field}`;
    }
  }
  return payload;
}

export const TriggerPicker = {
  list: listTriggerCatalog,
  byCategory: listTriggersByCategory,
  get: getTriggerCatalogEntry,
  samplePayload: samplePayloadForTrigger,
};
