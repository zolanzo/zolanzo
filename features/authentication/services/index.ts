/**
 * Authentication services — production auth platform (Sprint 1 Part 2).
 */

export { provisionAuthenticatedUser } from "./provisioning";
export {
  signInWithEmail,
  signOutCurrent,
  signUpWithEmail,
  requestPasswordReset,
  updatePassword,
  resendVerificationEmail,
} from "./auth-service";
export {
  listDevices,
  listSessions,
  revokeAllSessions,
  revokeSession,
} from "./session-service";
