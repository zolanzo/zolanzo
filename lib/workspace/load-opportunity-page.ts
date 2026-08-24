import { getWorkOpportunityByPublicId } from "@/features/task-marketplace/services";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";
import type { WorkOpportunity } from "@/features/task-marketplace/types";
import type { DataBoundary } from "@/lib/workspace/data-boundary";

export async function loadWorkOpportunityForPage(id: string): Promise<
  | { status: "ok"; opportunity: WorkOpportunity }
  | { status: "unavailable"; boundary: DataBoundary }
> {
  try {
    const result = await getWorkOpportunityByPublicId(id);
    if (!result.ok) {
      return {
        status: "unavailable",
        boundary: {
          kind: "unavailable",
          service: "database",
          message: "This task is not available.",
        },
      };
    }
    return { status: "ok", opportunity: result.data };
  } catch (error) {
    return {
      status: "unavailable",
      boundary: {
        kind: "unavailable",
        service: "database",
        message: isBackendUnavailableError(error)
          ? "Unable to load this task."
          : error instanceof Error
            ? error.message
            : "Unable to load this task.",
      },
    };
  }
}
