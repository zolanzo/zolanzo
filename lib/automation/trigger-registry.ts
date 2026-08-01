/**
 * TriggerRegistry — maps trigger types to metadata / payload contracts.
 */

import {
  AUTOMATION_TRIGGERS,
  type AutomationTriggerType,
} from "@/lib/automation/types";

export type TriggerDefinition = {
  type: AutomationTriggerType;
  description: string;
  /** Suggested payload fields for condition authors */
  payloadFields: string[];
};

const DEFINITIONS: TriggerDefinition[] = [
  {
    type: "worker.registered",
    description: "A new worker account was registered",
    payloadFields: ["userId", "organizationId", "region"],
  },
  {
    type: "campaign.created",
    description: "A campaign was created",
    payloadFields: ["campaignId", "organizationId", "region"],
  },
  {
    type: "assignment.accepted",
    description: "A worker accepted an assignment",
    payloadFields: ["assignmentId", "userId", "campaignId", "organizationId"],
  },
  {
    type: "assignment.completed",
    description: "An assignment was completed",
    payloadFields: ["assignmentId", "userId", "campaignId", "organizationId"],
  },
  {
    type: "submission.approved",
    description: "A submission was approved",
    payloadFields: ["submissionId", "userId", "campaignId", "trustScore"],
  },
  {
    type: "submission.rejected",
    description: "A submission was rejected",
    payloadFields: ["submissionId", "userId", "campaignId"],
  },
  {
    type: "payment.settled",
    description: "A payment / settlement completed",
    payloadFields: ["paymentId", "userId", "amountMinor", "paymentStatus"],
  },
  {
    type: "trust.updated",
    description: "A trust profile was recalculated",
    payloadFields: ["userId", "trustScore", "trend"],
  },
  {
    type: "forecast.generated",
    description: "A forecast was generated",
    payloadFields: ["forecastType", "confidence", "organizationId"],
  },
  {
    type: "report.generated",
    description: "A BI report was generated",
    payloadFields: ["reportType", "reportId", "organizationId"],
  },
];

const byType = new Map(DEFINITIONS.map((d) => [d.type, d]));

export function getTrigger(type: AutomationTriggerType): TriggerDefinition | undefined {
  return byType.get(type);
}

export function listTriggers(): TriggerDefinition[] {
  return [...byType.values()];
}

export function isKnownTrigger(type: string): type is AutomationTriggerType {
  return (AUTOMATION_TRIGGERS as readonly string[]).includes(type);
}

export const TriggerRegistry = {
  get: getTrigger,
  list: listTriggers,
  isKnown: isKnownTrigger,
};
