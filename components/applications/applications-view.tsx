"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { ApplicationDetailsModal, type ApplicationItem } from "@/components/applications/application-details-modal";
import { type ApplicationStatus } from "@/components/applications/application-timeline";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import type { EarnerWorkItem, EarnerWorkspace } from "@/lib/workspace/earner-types";

type ApplicationFilterTab = "All" | "In Progress" | "Awaiting Review" | "Approved" | "Rejected" | "Paid";

function workStatus(item: EarnerWorkItem): ApplicationStatus {
  const submission = item.submissionStatus;
  if (submission === "approved") return "Approved";
  if (submission === "rejected") return "Rejected";
  if (
    submission === "submitted" ||
    submission === "validating" ||
    submission === "validation_complete" ||
    submission === "in_review"
  ) {
    return "Awaiting Review";
  }
  if (
    item.assignmentStatus === "submitted" ||
    item.assignmentStatus === "under_validation" ||
    item.assignmentStatus === "under_review"
  ) {
    return "Awaiting Review";
  }
  if (item.assignmentStatus === "approved" || item.assignmentStatus === "completed") {
    return "Approved";
  }
  if (item.assignmentStatus === "rejected") return "Rejected";
  return "In Progress";
}

export function ApplicationsView({ workspace }: { workspace: EarnerWorkspace }) {
  const [activeTab, setActiveTab] = useState<ApplicationFilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  const applications: ApplicationItem[] = useMemo(
    () =>
      workspace.workItems.map((item) => ({
        id: item.id,
        title: item.title,
        employer: "Hirer",
        reward: formatNgnFromMinor(item.rewardMinor),
        status: workStatus(item),
        submittedDate: item.submittedAt || item.createdAt,
        reviewTimeline: "",
        taskId: item.instancePublicId,
      })),
    [workspace.workItems],
  );

  const filteredApps = applications.filter((app) => {
    const matchesTab =
      activeTab === "All"
        ? true
        : activeTab === "Approved"
          ? app.status === "Approved" || app.status === "Paid"
          : app.status === activeTab;
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <>
      <ApplicationDetailsModal application={selectedApp} onClose={() => setSelectedApp(null)} />

      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-foreground">Applications</h1>
          </div>

          <Link
            href="/tasks"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shrink-0"
          >
            <span>Find work</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(["All", "In Progress", "Awaiting Review", "Approved", "Paid", "Rejected"] as ApplicationFilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 h-9 rounded-xl text-xs font-bold whitespace-nowrap ${
                  activeTab === tab
                    ? "border border-primary/25 bg-primary-subtle text-primary"
                    : "bg-card border border-border text-muted-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
            />
          </div>
        </div>

        {filteredApps.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Start a task to track it here. Paid only appears after a live wallet credit."
              actionLabel="Find work"
              actionHref="/tasks"
            />
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-bold text-foreground">{app.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} size={14} /> {app.submittedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className="text-sm font-black text-primary">{app.reward}</span>

                  <span className="px-3 py-1 rounded-xl bg-muted border border-border text-xs font-bold text-foreground">
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
