/**
 * Recipient resolution — worker / client / org members / reviewer / admin.
 */

import type { RecipientRole } from "@/constants/notification";

export type RecipientHint = {
  role: RecipientRole;
  userId?: string;
  email?: string | null;
  phone?: string | null;
  pushToken?: string | null;
  webhookUrl?: string | null;
  displayName?: string | null;
};

export type ResolvedRecipient = {
  userId: string | null;
  role: RecipientRole;
  displayName: string;
  email: string | null;
  phone: string | null;
  pushToken: string | null;
  webhookUrl: string | null;
};

export type RecipientAddressByChannel = {
  email: string | null;
  sms: string | null;
  whatsapp: string | null;
  push: string | null;
  in_app: string | null;
  webhook: string | null;
};

export function addressForChannel(
  recipient: ResolvedRecipient,
): RecipientAddressByChannel {
  return {
    email: recipient.email,
    sms: recipient.phone,
    whatsapp: recipient.phone,
    push: recipient.pushToken,
    in_app: recipient.userId,
    webhook: recipient.webhookUrl,
  };
}

/**
 * Pure resolver — callers supply already-loaded hints (DB lookups stay in hub).
 */
export function resolveRecipients(
  hints: readonly RecipientHint[],
): ResolvedRecipient[] {
  const seen = new Set<string>();
  const out: ResolvedRecipient[] = [];

  for (const hint of hints) {
    const key =
      hint.userId ??
      hint.email ??
      hint.phone ??
      hint.webhookUrl ??
      `${hint.role}:anon`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      userId: hint.userId ?? null,
      role: hint.role,
      displayName: hint.displayName?.trim() || hint.email || hint.role,
      email: hint.email ?? null,
      phone: hint.phone ?? null,
      pushToken: hint.pushToken ?? null,
      webhookUrl: hint.webhookUrl ?? null,
    });
  }

  return out;
}

export function recipientsMissingChannelAddress(params: {
  recipients: readonly ResolvedRecipient[];
  channel: keyof RecipientAddressByChannel;
}): ResolvedRecipient[] {
  return params.recipients.filter((r) => {
    const addr = addressForChannel(r)[params.channel];
    return !addr;
  });
}
