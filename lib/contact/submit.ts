import "server-only";

import { apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import {
  consumeMathNonce,
  createMathChallenge,
  decodeMathChallenge,
  type PublicMathChallenge,
  resolveContactChallengeSecret,
  verifyMathAnswer,
} from "@/lib/contact/math-challenge";
import { sendContactMessage } from "@/lib/contact/send-message";
import { validateContactFields } from "@/lib/contact/validate";

const GENERIC_FAILURE = "Something went wrong. Please try again.";
const MATH_FAILURE = "Check the maths answer and try again.";

export type ContactSubmitResult = ApiResponse<{ challenge: PublicMathChallenge }>;

export async function submitContactMessage(
  raw: unknown,
  options?: {
    send?: typeof sendContactMessage;
    secret?: string;
    nowMs?: number;
  },
): Promise<ContactSubmitResult> {
  const secret = options?.secret ?? resolveContactChallengeSecret();

  if (!secret) {
    return apiError("UNAVAILABLE", GENERIC_FAILURE);
  }

  if (!raw || typeof raw !== "object") {
    return apiError("INVALID", GENERIC_FAILURE);
  }

  const body = raw as Record<string, unknown>;
  const validated = validateContactFields({
    name: body.name,
    email: body.email,
    subject: body.subject,
    message: body.message,
    website: body.website,
  });

  if (!validated.ok) {
    if (validated.honeypot) {
      return apiError("INVALID", GENERIC_FAILURE);
    }
    return apiError("VALIDATION", GENERIC_FAILURE, {
      fields: validated.errors,
    });
  }

  const token = typeof body.challengeToken === "string" ? body.challengeToken : "";
  const math = verifyMathAnswer({
    token,
    answer: body.mathAnswer,
    secret,
    nowMs: options?.nowMs,
  });

  if (!math.ok) {
    return apiError("MATH", MATH_FAILURE);
  }

  const payload = decodeMathChallenge(token, secret);
  if (!payload || !consumeMathNonce(math.nonce, payload.exp, options?.nowMs)) {
    return apiError("MATH", MATH_FAILURE);
  }

  const send = options?.send ?? sendContactMessage;
  const delivered = await send(validated.fields);
  if (!delivered.success) {
    return apiError("DELIVERY", GENERIC_FAILURE);
  }

  const challenge = createMathChallenge({ secret, nowMs: options?.nowMs });
  if (!challenge) {
    return apiError("UNAVAILABLE", GENERIC_FAILURE);
  }

  return apiSuccess({ challenge });
}
