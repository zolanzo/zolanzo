export const CONTACT_SUBJECTS = [
  { value: "general", label: "General Enquiry" },
  { value: "account", label: "Account & Login" },
  { value: "find_work", label: "Find Work" },
  { value: "hiring", label: "Hiring / Campaigns" },
  { value: "payments", label: "Payments & Wallet" },
  { value: "technical", label: "Technical Issue" },
  { value: "report", label: "Report a Problem" },
  { value: "other", label: "Other" },
] as const;

export type ContactSubjectValue = (typeof CONTACT_SUBJECTS)[number]["value"];

const SUBJECT_VALUES = new Set<string>(CONTACT_SUBJECTS.map((item) => item.value));

export function isContactSubject(value: string): value is ContactSubjectValue {
  return SUBJECT_VALUES.has(value);
}

export function contactSubjectLabel(value: ContactSubjectValue): string {
  const match = CONTACT_SUBJECTS.find((item) => item.value === value);
  return match?.label ?? "General Enquiry";
}
