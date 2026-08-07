"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, EyeIcon } from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { EmployerReviewDrawer, type ApplicantReviewItem } from "@/components/applications/employer-review-drawer";
import { EmptyState } from "@/components/ui/empty-state";

export default function HirerApplicationsPage() {
  const [filter, setFilter] = useState<string>("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<ApplicantReviewItem | null>(null);

  const [applications, setApplications] = useState<ApplicantReviewItem[]>([
    {
      id: "app_201",
      workerName: "Grace Adebayo",
      workerAvatar: "/brand/lady1.png",
      approvalRate: "98.4%",
      completedTasks: 932,
      opportunityTitle: "AI Model Image Dataset Annotation",
      reward: "₦850",
      submittedAt: "10 mins ago",
      evidenceText: "Completed 50 street view bounding boxes correctly. Verified image label accuracy.",
      evidenceFileName: "bounding_boxes_proof.png",
      status: "Pending",
    },
    {
      id: "app_202",
      workerName: "Chidi Okonkwo",
      workerAvatar: "/brand/lady1.png",
      approvalRate: "99.1%",
      completedTasks: 1420,
      opportunityTitle: "Mobile Banking Usability & Feedback Survey",
      reward: "₦1,200",
      submittedAt: "30 mins ago",
      evidenceText: "Completed transfer test flow on iOS v17. Feedback submitted regarding button layout.",
      status: "Pending",
    },
    {
      id: "app_203",
      workerName: "Fatima Bello",
      workerAvatar: "/brand/lady1.png",
      approvalRate: "97.8%",
      completedTasks: 410,
      opportunityTitle: "Customer Support Live Chat Assistance",
      reward: "₦5,000",
      submittedAt: "Yesterday",
      evidenceText: "Handled 15 live customer support tickets cleanly.",
      status: "Accepted",
    },
  ]);

  const handleAction = (id: string, newStatus: "Accepted" | "Rejected" | "Revision Requested") => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.opportunityTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || app.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <EmployerReviewDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onAction={handleAction}
      />

      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Application Review Queue
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                {applications.filter((a) => a.status === "Pending").length} Pending Review
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Inspect submitted worker evidence, release escrow payouts, or request revisions.
            </p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(["Pending", "Accepted", "Rejected", "Revision Requested", "All"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === tab
                    ? "bg-purple-600/20 border border-purple-500 text-white"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker or title..."
              className="w-full h-[38px] pl-9 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Applications List */}
        {filteredApps.length === 0 ? (
          <EmptyState
            title="No applications in queue"
            description="All submitted worker applications in this filter have been reviewed."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-[#0A0F12] border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      app.status === "Pending"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : app.status === "Accepted"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {app.status}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold text-xs">{app.reward}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{app.opportunityTitle}</h3>

                  {/* Worker Brief */}
                  <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                    <Image
                      src={app.workerAvatar}
                      alt={app.workerName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">{app.workerName}</h4>
                      <p className="text-[10px] text-zinc-400">{app.approvalRate} Rating • {app.completedTasks} Tasks</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    className="w-full h-[40px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <HugeiconsIcon icon={EyeIcon} size={16} />
                    <span>Inspect Evidence & Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
}
