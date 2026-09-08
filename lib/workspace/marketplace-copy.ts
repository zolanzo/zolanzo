/** User-facing marketplace copy. Domain messages stay authoritative. */

export function campaignStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "pending_review":
      return "Pending review";
    case "scheduled":
      return "Scheduled";
    case "archived":
      return "Archived";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

export function startTaskButtonLabel(params: {
  pending: boolean;
  viewerCanContinue?: boolean;
}): string {
  if (params.pending) return "Starting…";
  return params.viewerCanContinue ? "Continue" : "Start";
}

export function claimActionErrorMessage(code: string, message: string): string {
  if (code === "ALREADY_CLAIMED" || code === "INVENTORY_UNAVAILABLE") {
    return message || "This task is no longer available.";
  }
  if (code === "CAMPAIGN_NOT_ACTIVE") {
    return message || "This campaign is not open for new work.";
  }
  if (code === "NOT_ELIGIBLE" || code === "CLAIM_POLICY_DENIED") {
    return message || "You are not eligible for this task.";
  }
  return message;
}

export function workSessionStatusLabel(status: string | null): string {
  if (!status) return "Claimed";
  if (["assigned", "claimed"].includes(status)) return "Claimed";
  if (["started", "in_progress", "ready_for_submission"].includes(status)) {
    return "Working";
  }
  if (["draft", "ready"].includes(status)) return "Evidence";
  if (status === "submitted") return "Submitted";
  if (
    ["validating", "validation_complete", "in_review", "under_validation", "under_review"].includes(
      status,
    )
  ) {
    return "Pending review";
  }
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status.replaceAll("_", " ");
}
