/**
 * Transactional email templates will live here.
 * Prefer React Email when email features are built.
 */

export type EmailTemplateId =
  | "welcome"
  | "password-reset"
  | "task-assigned"
  | "payout-completed";

export type EmailPayload = {
  to: string;
  templateId: EmailTemplateId;
  subject: string;
  variables?: Record<string, string>;
};
