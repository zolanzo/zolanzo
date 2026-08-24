import { requireHirerWorkspace } from "@/lib/workspace/hirer";
import { getCampaignByPublicId } from "@/features/campaigns/services/campaign-service";
import { campaignRepository } from "@/features/campaigns/repositories";
import { HirerOpportunityDetailView } from "@/components/hirer/opportunity-detail-view";
import { CampaignUnavailableView } from "@/components/hirer/campaign-unavailable-view";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { CampaignRecord } from "@/features/campaigns/types";
import type { DataBoundary } from "@/lib/workspace/data-boundary";

export const dynamic = "force-dynamic";

async function loadCampaign(id: string): Promise<
  | { status: "ok"; campaign: CampaignRecord }
  | { status: "missing" }
  | { status: "unavailable"; boundary: DataBoundary }
> {
  try {
    const byPublic = await getCampaignByPublicId(id);
    const campaign = byPublic ?? (await campaignRepository.findById(id));
    if (!campaign) return { status: "missing" };
    return { status: "ok", campaign };
  } catch (error) {
    return {
      status: "unavailable",
      boundary: {
        kind: "unavailable",
        service: "database",
        message: isBackendUnavailableError(error)
          ? "Unable to load this campaign."
          : error instanceof Error
            ? error.message
            : "Unable to load this campaign.",
      },
    };
  }
}

export default async function HirerOpportunityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await requireHirerWorkspace();

  if (!isLiveBoundary(workspace.loadState)) {
    return <CampaignUnavailableView workspace={workspace} />;
  }

  const loaded = await loadCampaign(id);
  if (loaded.status === "unavailable") {
    return <CampaignUnavailableView workspace={workspace} boundary={loaded.boundary} />;
  }
  if (loaded.status === "missing") {
    return (
      <CampaignUnavailableView
        workspace={workspace}
        boundary={{
          kind: "unavailable",
          service: "database",
          message: "This campaign is not available.",
        }}
      />
    );
  }

  const allowedOrgIds = new Set(
    workspace.organization ? [workspace.organization.id] : [],
  );
  if (
    loaded.campaign.clientUserId !== workspace.userId &&
    !allowedOrgIds.has(loaded.campaign.organizationId)
  ) {
    return (
      <CampaignUnavailableView
        workspace={workspace}
        boundary={{
          kind: "unavailable",
          service: "database",
          message: "This campaign is not available.",
        }}
      />
    );
  }

  return <HirerOpportunityDetailView workspace={workspace} campaign={loaded.campaign} />;
}
