"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveCampaignAction,
  rejectCampaignAction,
} from "@/features/campaigns/actions/campaign-actions";
import { recordReviewDecisionAction } from "@/features/verification/actions/review-actions";
import type { CampaignRecord } from "@/features/campaigns/types";
import type { ReviewQueueItemRecord } from "@/features/verification/types/review";

export function CoreMarketplaceQueues({
  campaigns,
  reviews,
}: {
  campaigns: CampaignRecord[];
  reviews: ReviewQueueItemRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Campaigns pending review
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-border rounded-2xl p-4 bg-card">
            No campaigns waiting for approval.
          </p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-2xl border border-border bg-card p-3 space-y-2"
              >
                <p className="text-sm font-bold text-foreground">{campaign.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {campaign.publicId} · {campaign.category} · {campaign.status}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await approveCampaignAction(campaign.id);
                        if (!result.ok) {
                          setError(result.error.message);
                          return;
                        }
                        refresh();
                      })
                    }
                    className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await rejectCampaignAction(campaign.id);
                        if (!result.ok) {
                          setError(result.error.message);
                          return;
                        }
                        refresh();
                      })
                    }
                    className="h-9 px-3 rounded-xl border border-border text-foreground text-xs font-bold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Submissions in review
        </h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground border border-border rounded-2xl p-4 bg-card">
            No live submissions in the review queue.
          </p>
        ) : (
          <div className="space-y-2">
            {reviews.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-3 space-y-2"
              >
                <p className="text-sm font-bold text-foreground">
                  Queue {item.status.replaceAll("_", " ")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Policy {item.policyKey} · priority {item.priority}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await recordReviewDecisionAction({
                          queueItemId: item.id,
                          outcome: "approved",
                          findings: [],
                        });
                        if (!result.ok) {
                          setError(result.error.message);
                          return;
                        }
                        refresh();
                      })
                    }
                    className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setError(null);
                        const result = await recordReviewDecisionAction({
                          queueItemId: item.id,
                          outcome: "rejected",
                          findings: [
                            {
                              category: "quality",
                              severity: "major",
                              message: "Rejected by staff review",
                            },
                          ],
                        });
                        if (!result.ok) {
                          setError(result.error.message);
                          return;
                        }
                        refresh();
                      })
                    }
                    className="h-9 px-3 rounded-xl border border-border text-foreground text-xs font-bold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
