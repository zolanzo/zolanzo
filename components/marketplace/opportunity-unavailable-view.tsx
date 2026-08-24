"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { DataBoundaryBanner } from "@/components/workspace/data-boundary-banner";
import type { DataBoundary } from "@/lib/workspace/data-boundary";

export function OpportunityUnavailableView({
  boundary,
}: {
  boundary: DataBoundary;
}) {
  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        <DataBoundaryBanner boundary={boundary} />
        <EmptyState
          type="tasks"
          title="Unable to load this task"
          description="This opportunity is not available to display right now."
          actionLabel="Back to tasks"
          actionHref="/tasks"
        />
        <Link href="/tasks" className="block text-center text-xs font-bold text-primary">
          Browse tasks
        </Link>
      </div>
    </AppShell>
  );
}
