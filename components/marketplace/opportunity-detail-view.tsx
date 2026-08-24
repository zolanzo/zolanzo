"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { ConnectAccountSheet } from "@/components/marketplace/connect-account-sheet";
import { useToast } from "@/providers/toast-provider";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { formatDurationMin, inferSocialPlatform } from "@/lib/platforms/infer";
import { useCapabilities } from "@/lib/capabilities-service";
import { startOpportunityAction } from "@/features/task-marketplace/actions/marketplace-actions";
import type { WorkOpportunity } from "@/features/task-marketplace/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export function OpportunityDetailView({ opportunity }: { opportunity: WorkOpportunity }) {
  const router = useRouter();
  const { toast } = useToast();
  const { getTaskAccess } = useCapabilities();
  const [pending, startTransition] = useTransition();
  const [connectOpen, setConnectOpen] = useState(false);
  const platform = inferSocialPlatform(
    opportunity.category,
    opportunity.title,
    opportunity.templateName,
  );
  const access = getTaskAccess(platform);

  function start() {
    if (access.status === "unavailable" || access.status === "rejected") {
      setConnectOpen(true);
      return;
    }
    if (!access.isAccessible) {
      toast({ title: access.reason, variant: "warning" });
      return;
    }
    startTransition(async () => {
      const result = await startOpportunityAction(opportunity.instancePublicId);
      if (!result.ok) {
        toast({ title: result.error.message, variant: "danger" });
        return;
      }
      router.push(`/tasks/${opportunity.instancePublicId}/work`);
    });
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-3 px-4 pb-4">
        <Link href="/tasks" className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Tasks
        </Link>

        <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3 min-w-0">
            <SocialBrandIcon platform={platform} size={24} withContainer />
            <div className="min-w-0">
              <h1 className="text-base font-black text-foreground truncate">{opportunity.title}</h1>
              <p className="text-xs text-foreground">{platform}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Meta label="Reward" value={formatNgnFromMinor(opportunity.rewardPerUnitMinor)} />
            <Meta label="Time" value={formatDurationMin(opportunity.estimatedDurationMin)} />
            <Meta label="Proof" value="Required" />
          </div>

          {opportunity.objective ? (
            <p className="text-xs text-foreground leading-relaxed">{opportunity.objective}</p>
          ) : null}

          {!access.isAccessible ? (
            <p className="text-xs text-foreground leading-snug">{access.reason}</p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={start}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-bold sticky bottom-20 lg:static focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {pending ? "Starting…" : "Start"}
          </button>
        </section>
      </div>

      {connectOpen ? (
        <ConnectAccountSheet
          platform={platform}
          readiness={access}
          isOpen
          onClose={() => setConnectOpen(false)}
          onSuccess={() => {
            setConnectOpen(false);
            toast({
              title: "Submitted on this device. Pending review — not verified.",
              variant: "warning",
            });
          }}
        />
      ) : null}
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted border border-border">
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{label}</span>
      <span className="text-xs font-black text-foreground mt-0.5 block">{value}</span>
    </div>
  );
}
