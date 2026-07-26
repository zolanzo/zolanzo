/**
 * Authentication method registry — architecture only.
 * Supabase Auth / IdPs plug into these ids later.
 */

export const AUTH_METHODS = [
  {
    id: "email_password",
    label: "Email + Password",
    category: "password",
    status: "planned",
  },
  {
    id: "magic_link",
    label: "Magic Link",
    category: "passwordless",
    status: "planned",
  },
  {
    id: "google",
    label: "Google",
    category: "oauth",
    status: "planned",
  },
  {
    id: "apple",
    label: "Apple",
    category: "oauth",
    status: "planned",
  },
  {
    id: "github",
    label: "GitHub",
    category: "oauth",
    status: "planned",
  },
  {
    id: "microsoft",
    label: "Microsoft",
    category: "oauth",
    status: "planned",
  },
  {
    id: "facebook",
    label: "Facebook",
    category: "oauth",
    status: "planned",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    category: "oauth",
    status: "planned",
  },
  {
    id: "phone_otp",
    label: "Phone OTP",
    category: "otp",
    status: "planned",
  },
  {
    id: "totp",
    label: "Authenticator App (TOTP)",
    category: "mfa",
    status: "planned",
  },
  {
    id: "passkey",
    label: "Passkeys",
    category: "webauthn",
    status: "future",
  },
  {
    id: "webauthn",
    label: "WebAuthn",
    category: "webauthn",
    status: "future",
  },
] as const;

export type AuthMethodId = (typeof AUTH_METHODS)[number]["id"];

export type AuthMethodCategory =
  (typeof AUTH_METHODS)[number]["category"];
