import { getAuthContext } from "@/lib/auth/session";
import { getWorkOpportunityByPublicId } from "@/features/task-marketplace/services";
import { canViewWorkOpportunity } from "@/features/task-marketplace/services/marketplace-visibility";
import { assignmentRepository } from "@/features/assignments/repositories";
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

    const ctx = await getAuthContext();
    let viewerCanContinue = false;
    if (ctx) {
      const assignment = await assignmentRepository.findByTaskInstanceId(
        result.data.instanceId,
      );
      viewerCanContinue = assignment?.workerUserId === ctx.user.id;
    }

    if (
      !canViewWorkOpportunity({
        campaignStatus: result.data.campaignStatus,
        campaignVisibility: result.data.campaignVisibility,
        viewerCanContinue,
      })
    ) {
      return {
        status: "unavailable",
        boundary: {
          kind: "unavailable",
          service: "database",
          message: "This task is not available.",
        },
      };
    }

    return {
      status: "ok",
      opportunity: { ...result.data, viewerCanContinue },
    };
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
