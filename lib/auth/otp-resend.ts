/** Resend countdown is only meaningful when a verification email is in context. */
export function hasEmailVerificationContext(email: string | null | undefined): boolean {
  return Boolean(email && email.trim());
}
