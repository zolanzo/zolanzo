/**
 * Client entity kinds — who posts work on ZOLANZO.
 * Replaces narrow "advertiser" framing.
 */

export const CLIENT_ENTITY_KINDS = [
  "individual",
  "company",
  "agency",
  "startup",
  "enterprise",
  "government",
  "ngo",
  "university",
] as const;

export type ClientEntityKind = (typeof CLIENT_ENTITY_KINDS)[number];

export const CLIENT_ENTITY_LABELS: Record<ClientEntityKind, string> = {
  individual: "Individual",
  company: "Company",
  agency: "Agency",
  startup: "Startup",
  enterprise: "Enterprise",
  government: "Government",
  ngo: "NGO",
  university: "University",
};
