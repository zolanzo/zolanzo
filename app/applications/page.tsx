"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { ApplicationDetailsModal, type ApplicationItem } from "@/components/applications/application-details-modal";
import { type ApplicationStatus } from "@/components/applications/application-timeline";
import { EmptyState } from "@/components/ui/empty-state";

import { zolanzoEngine } from "@/lib/engine/business-engine";
import { useRealtimeChannel } from "@/lib/realtime/subscriptions";

type ApplicationFilterTab = "All" | "In Progress" | "Awaiting Review" | "Approved" | "Rejected" | "Paid";

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<ApplicationFilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  const [appsList, setAppsList] = useState(() => zolanzoEngine.getApplicationsForWorker("WORKER_100"));

  useRealtimeChannel("applications", () => {
    setAppsList(zolanzoEngine.getApplicationsForWorker("WORKER_100"));
  });

  const applications: ApplicationItem[] = appsList.map((a) => {
    let status: ApplicationStatus = "Applied";
    if (a.status === "AwaitingReview") status = "Awaiting Review";
    else if (a.status === "InWork") status = "In Progress";
    else if (a.status === "Approved") status = "Approved";
    else if (a.status === "Rejected") status = "Rejected";
    else if (a.status === "Paid") status = "Paid";
    else if (a.status === "Accepted") status = "Accepted";
    else if (a.status === "Submitted") status = "Submitted";

    return {
      id: a.id,
      title: a.opportunityTitle,
      employer: "Verified Hirer",
      reward: a.reward,
      status,
      submittedDate: a.submittedAt || a.appliedAt,
      reviewTimeline: status === "Awaiting Review" ? "Review within 12 hours" : "Active",
      taskId: a.opportunityId,
      payoutRef: `TX_${a.id.substring(4)}`,
    };
  });

  const filteredApps = applications.filter((app) => {
    const matchesTab =
      activeTab === "All"
        ? true
        : activeTab === "Approved"
        ? app.status === "Approved" || app.status === "Paid"
        : app.status === activeTab;
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.employer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <ApplicationDetailsModal application={selectedApp} onClose={() => setSelectedApp(null)} />

      <div className="max-w-[1280px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Applications
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {applications.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Track the full state machine of your applied opportunities, submissions in progress, and approved payouts.
            </p>
          </div>

          <Link
            href="/tasks"
            className="h-[44px] px-5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
          >
            <span>Find Opportunities</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Link>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0 overflow-x-auto no-scrollbar">
            {(["All", "In Progress", "Awaiting Review", "Approved", "Paid", "Rejected"] as ApplicationFilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#008744]/20 border border-[#008744] text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full h-[38px] pl-9 pr-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Applications List */}
        {filteredApps.length === 0 ? (
          <EmptyState
            title="No applications found"
            description="You don't have any applications matching the selected criteria. Explore available opportunities to start earning."
            actionLabel="Find Opportunities"
            actionHref="/tasks"
          />
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{app.title}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                      {app.employer}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} size={14} /> {app.submittedDate}
                    </span>
                    <span>•</span>
                    <span>{app.reviewTimeline}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <span className="text-xl font-black text-emerald-400">{app.reward}</span>

                  <span className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300">
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
}
