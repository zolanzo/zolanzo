import "server-only";

import { APP_CONFIG } from "@/config/app";
import { getContactInboxTemplate, getContactInboxText } from "@/lib/email/templates";
import { postResendEmail } from "@/lib/email/resend";
import {
  contactSubjectLabel,
  type ContactSubjectValue,
} from "@/lib/contact/subjects";

export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject: ContactSubjectValue;
  message: string;
}): Promise<{ success: boolean; id?: string }> {
  const subjectLabel = contactSubjectLabel(input.subject);
  const html = getContactInboxTemplate({
    name: input.name,
    email: input.email,
    subjectLabel,
    message: input.message,
  });
  const text = getContactInboxText({
    name: input.name,
    email: input.email,
    subjectLabel,
    message: input.message,
  });

  return postResendEmail({
    to: APP_CONFIG.supportEmail,
    replyTo: input.email,
    subject: `Contact: ${subjectLabel}`,
    html,
    text,
  });
}
