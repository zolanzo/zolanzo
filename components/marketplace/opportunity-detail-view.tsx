"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useToast } from "@/providers/toast-provider";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { formatDurationMin, inferSocialPlatform } from "@/lib/platforms/infer";
import { startOpportunityAction } from "@/features/task-marketplace/actions/marketplace-actions";
import { isOpportunityStartable } from "@/features/task-marketplace/services/marketplace-visibility";
import {
  claimActionErrorMessage,
  startTaskButtonLabel,
} from "@/lib/workspace/marketplace-copy";
import type { WorkOpportunity } from "@/features/task-marketplace/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export function OpportunityDetailView({ opportunity }: { opportunity: WorkOpportunity }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const platform = inferSocialPlatform(
    opportunity.category,
    opportunity.title,
    opportunity.templateName,
  );
  const canStart = isOpportunityStartable({
    instanceStatus: opportunity.instanceStatus,
    campaignStatus: opportunity.campaignStatus,
    viewerCanContinue: opportunity.viewerCanContinue,
  });
  const whatToDo = opportunity.description?.trim() || opportunity.objective?.trim() || "";

  function start() {
    if (!canStart || pending) return;
    startTransition(async () => {
      const result = await startOpportunityAction(opportunity.instancePublicId);
      if (!result.ok) {
        toast({
          title: claimActionErrorMessage(result.error.code, result.error.message),
          variant: "danger",
        });
        return;
      }
      router.push(`/tasks/${opportunity.instancePublicId}/work`);
    });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-3 px-4 pb-4">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Tasks
        </Link>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <SocialBrandIcon platform={platform} size={24} withContainer />
            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-foreground">
                {opportunity.title}
              </h1>
              <p className="text-xs text-foreground">{platform}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Meta label="Reward" value={formatNgnFromMinor(opportunity.rewardPerUnitMinor)} />
            <Meta label="Time" value={formatDurationMin(opportunity.estimatedDurationMin)} />
            {opportunity.templateName ? (
              <Meta label="Type" value={opportunity.templateName} />
            ) : null}
          </div>

          {whatToDo ? (
            <div className="space-y-1">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                What to do
              </h2>
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {whatToDo}
              </p>
            </div>
          ) : null}

          {!canStart ? (
            <p className="text-xs leading-snug text-foreground">
              This task is not available to start.
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending || !canStart}
            onClick={start}
            aria-busy={pending}
            className="sticky bottom-20 h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 lg:static"
          >
            {startTaskButtonLabel({
              pending,
              viewerCanContinue: opportunity.viewerCanContinue,
            })}
          </button>
        </section>
      </div>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-2.5">
      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block text-xs font-black text-foreground">{value}</span>
    </div>
  );
}
