/**
 * Worker-facing category labels for Work Opportunities.
 */

const LABELS: Record<string, string> = {
  app_testing: "App Testing",
  ai_data: "AI Data Collection",
  field: "Property Verification",
  research: "Research",
  growth: "Growth",
  qa: "QA",
  voice: "Voice Collection",
  translation: "Translation",
};

export function opportunityCategoryLabel(category: string): string {
  return LABELS[category] ?? category.replace(/_/g, " ");
}
