/**
 * Search index domains.
 */

export const SEARCH_INDEXES = [
  "workers",
  "clients",
  "campaigns",
  "tasks",
  "organizations",
  "documentation",
] as const;

export type SearchIndex = (typeof SEARCH_INDEXES)[number];

export const SEARCH_MODES = [
  "keyword",
  "filtered",
  "faceted",
  "semantic_future",
] as const;
