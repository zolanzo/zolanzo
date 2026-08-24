/**
 * Local UI preview — development runtime only.
 *
 * Production and `next start` compile with NODE_ENV=production, so this
 * never opens protected routes or preview workspaces in deployed builds.
 * It does not mint a session, role, or user.
 */
export function isLocalUiPreview(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv === "development";
}
