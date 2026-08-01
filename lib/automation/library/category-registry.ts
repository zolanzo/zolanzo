/**
 * Category registry for Automation Library.
 */

import {
  AUTOMATION_LIBRARY_CATEGORIES,
  type AutomationLibraryCategory,
} from "@/lib/automation/library/types";

export type CategoryDefinition = {
  id: AutomationLibraryCategory;
  title: string;
  description: string;
};

const CATEGORIES: CategoryDefinition[] = [
  {
    id: "operations",
    title: "Operations",
    description: "Review SLA, queue escalations, payment failure alerts",
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Completion alerts, SLA risk, campaign reporting",
  },
  {
    id: "workers",
    title: "Workers",
    description: "Welcome, reminders, achievements, verification prompts",
  },
  {
    id: "organizations",
    title: "Organizations",
    description: "Executive reports, trust summaries, rejection alerts",
  },
  {
    id: "trust",
    title: "Trust",
    description: "Badge, decline, recalculation, fraud-related escalations",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Snapshots, dashboard refresh, scheduled BI reports",
  },
];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export function listCategories(): CategoryDefinition[] {
  return [...CATEGORIES];
}

export function getCategory(
  id: AutomationLibraryCategory,
): CategoryDefinition | undefined {
  return byId.get(id);
}

export function isKnownCategory(
  id: string,
): id is AutomationLibraryCategory {
  return (AUTOMATION_LIBRARY_CATEGORIES as readonly string[]).includes(id);
}

export const CategoryRegistry = {
  list: listCategories,
  get: getCategory,
  isKnown: isKnownCategory,
};
