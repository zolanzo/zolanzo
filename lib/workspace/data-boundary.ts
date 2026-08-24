export type DataBoundaryKind =
  | "live"
  | "unauthenticated"
  | "unavailable"
  | "fixture"
  | "loading";

export type DataBoundaryService =
  | "database"
  | "auth"
  | "payments"
  | "storage"
  | "realtime";

export type DataBoundary = {
  kind: DataBoundaryKind;
  service?: DataBoundaryService;
  message?: string;
};

export function isLiveBoundary(boundary: DataBoundary): boolean {
  return boundary.kind === "live";
}

export function isFixtureBoundary(boundary: DataBoundary): boolean {
  return boundary.kind === "fixture";
}

export function walletHeaderLabel(
  boundary: DataBoundary,
  liveLabel: string,
): string | undefined {
  if (boundary.kind === "live") return liveLabel;
  return undefined;
}

export function shellDisplayName(
  boundary: DataBoundary,
  liveName: string,
): string {
  if (boundary.kind === "live" && liveName.trim()) return liveName;
  return "Account";
}

export function dataBoundaryTitle(boundary: DataBoundary): string {
  switch (boundary.kind) {
    case "live":
      return "Live data";
    case "unauthenticated":
      return "Not signed in";
    case "unavailable":
      return "Unable to load";
    case "fixture":
      return "Development fixture";
    case "loading":
      return "Loading";
  }
}

export function dataBoundaryDescription(boundary: DataBoundary): string {
  if (boundary.message) return boundary.message;
  switch (boundary.kind) {
    case "live":
      return "";
    case "unauthenticated":
      return "Empty layout. Sign in for your account.";
    case "unavailable":
      if (boundary.service === "payments") {
        return "Payment provider is not configured. No money has moved.";
      }
      if (boundary.service === "auth") {
        return "Sign-in service is unreachable. Empty layout only.";
      }
      return "Workspace data is unavailable.";
    case "fixture":
      return "Development fixture. Not live production data.";
    case "loading":
      return "Loading…";
  }
}
