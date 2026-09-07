import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import {
  isContactSubject,
  type ContactSubjectValue,
} from "@/lib/contact/subjects";

export const CONTACT_NAME_MAX = 100;
export const CONTACT_MESSAGE_MIN = 4;
export const CONTACT_MESSAGE_MAX = 4000;

export type ContactFormFields = {
  name: string;
  email: string;
  subject: ContactSubjectValue;
  message: string;
};

export type ContactFieldErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripControls(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

export function sanitizeContactName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return collapseWhitespace(stripControls(raw)).slice(0, CONTACT_NAME_MAX);
}

export function sanitizeContactMessage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return stripControls(raw).trim().slice(0, CONTACT_MESSAGE_MAX);
}

export function validateContactFields(input: {
  name: unknown;
  email: unknown;
  subject: unknown;
  message: unknown;
  website?: unknown;
}):
  | { ok: true; fields: ContactFormFields }
  | { ok: false; errors: ContactFieldErrors; honeypot: boolean } {
  if (typeof input.website === "string" && input.website.trim().length > 0) {
    return { ok: false, errors: {}, honeypot: true };
  }

  const errors: ContactFieldErrors = {};
  const name = sanitizeContactName(input.name);
  const emailRaw = typeof input.email === "string" ? input.email : "";
  const email = normalizeEmail(emailRaw);
  const subjectRaw = typeof input.subject === "string" ? input.subject : "";
  const message = sanitizeContactMessage(input.message);

  if (name.length < 2) {
    errors.name = "Enter your name.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email.";
  }

  if (!isContactSubject(subjectRaw)) {
    errors.subject = "Select a subject.";
  }

  if (message.length < CONTACT_MESSAGE_MIN) {
    errors.message = "Enter a message.";
  }

  if (Object.keys(errors).length > 0 || !isContactSubject(subjectRaw)) {
    return { ok: false, errors, honeypot: false };
  }

  return {
    ok: true,
    fields: {
      name,
      email,
      subject: subjectRaw,
      message,
    },
  };
}
