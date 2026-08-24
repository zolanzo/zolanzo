"use client";

import React from "react";
import Link from "next/link";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { formatDurationMin, inferSocialPlatform } from "@/lib/platforms/infer";
import type { WorkOpportunity } from "@/features/task-marketplace/types";

export function OpportunityCard({ opportunity }: { opportunity: WorkOpportunity }) {
  const platform = inferSocialPlatform(
    opportunity.category,
    opportunity.title,
    opportunity.templateName,
  );

  return (
    <Link
      href={`/tasks/${opportunity.instancePublicId}`}
      className="flex min-w-0 items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <SocialBrandIcon platform={platform} size={22} withContainer containerSize="sm" />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold leading-tight text-foreground">{opportunity.title}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
            {platform}
            <span className="px-1 text-muted-foreground">·</span>
            {formatDurationMin(opportunity.estimatedDurationMin)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] font-black text-foreground sm:text-xs">
          {formatNgnFromMinor(opportunity.rewardPerUnitMinor)}
        </span>
        <span className="flex h-8 items-center rounded-xl bg-primary px-2.5 text-[11px] font-bold text-primary-foreground sm:px-3">
          Start
        </span>
      </div>
    </Link>
  );
}
