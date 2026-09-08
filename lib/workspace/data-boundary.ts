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

export function marketplaceEmptyCopy(boundary: DataBoundary): {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
} {
  if (boundary.kind === "live") {
    return {
      title: "No tasks yet",
      description: "When campaigns go live they will appear here.",
    };
  }
  if (boundary.kind === "unauthenticated") {
    return {
      title: "Sign in to find work",
      description: "Live tasks appear after you sign in.",
      actionLabel: "Log in",
      actionHref: "/login?next=/tasks",
    };
  }
  return {
    title: "No tasks available",
    description: dataBoundaryDescription(boundary) || "Task listings load when the marketplace is reachable.",
  };
}
