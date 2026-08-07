"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
  PauseIcon,
  PlayIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export interface HirerOpportunityItem {
  id: string;
  title: string;
  category: string;
  reward: string;
  totalSlots: number;
  acceptedCount: number;
  completedCount: number;
  applicantsCount: number;
  status: "Live" | "Paused" | "Completed" | "Draft" | "Archived";
  totalSpent: string;
  createdAt: string;
}

const SAMPLE_OPPORTUNITIES: HirerOpportunityItem[] = [
  {
    id: "opp_101",
    title: "AI Model Image Dataset Annotation",
    category: "AI Data",
    reward: "₦850",
    totalSlots: 1000,
    acceptedCount: 850,
    completedCount: 780,
    applicantsCount: 920,
    status: "Live",
    totalSpent: "₦663,000",
    createdAt: "2025-01-10",
  },
  {
    id: "opp_102",
    title: "Fintech Mobile Usability & Security Survey",
    category: "Research",
    reward: "₦1,200",
    totalSlots: 500,
    acceptedCount: 500,
    completedCount: 500,
    applicantsCount: 610,
    status: "Completed",
    totalSpent: "₦600,000",
    createdAt: "2025-01-02",
  },
  {
    id: "opp_103",
    title: "Instagram Brand Campaign Engagement Inspection",
    category: "Social Media",
    reward: "₦350",
    totalSlots: 2000,
    acceptedCount: 1400,
    completedCount: 1250,
    applicantsCount: 1550,
    status: "Paused",
    totalSpent: "₦437,500",
    createdAt: "2025-01-14",
  },
  {
    id: "opp_104",
    title: "Customer Support Live Chat Assistance",
    category: "Support",
    reward: "₦5,000",
    totalSlots: 50,
    acceptedCount: 12,
    completedCount: 10,
    applicantsCount: 45,
    status: "Live",
    totalSpent: "₦50,000",
    createdAt: "2025-01-18",
  },
];

export default function HirerOpportunitiesPage() {
  const [items, setItems] = useState<HirerOpportunityItem[]>(SAMPLE_OPPORTUNITIES);
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStatus = item.status === "Live" ? "Paused" : "Live";
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === "All" || item.status === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Campaign Opportunities
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                {items.length} Total Campaigns
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
              Create, monitor, pause, or audit active digital micro-task campaign opportunities.
            </p>
          </div>

          <Link
            href="/hirer/opportunities/new"
            className="h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            <span>Create New Opportunity</span>
          </Link>
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(["All", "Live", "Paused", "Completed", "Draft", "Archived"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === tab
                    ? "bg-emerald-600/20 border border-emerald-500 text-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities..."
              className="w-full h-[38px] pl-9 pr-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-xs text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View / Mobile Card View */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider">
                  <th className="p-4">Status</th>
                  <th className="p-4">Opportunity Title</th>
                  <th className="p-4">Reward / Slot</th>
                  <th className="p-4 text-center">Applicants</th>
                  <th className="p-4 text-center">Accepted</th>
                  <th className="p-4 text-center">Completed</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        item.status === "Live"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : item.status === "Paused"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <Link href={`/hirer/opportunities/${item.id}`} className="font-bold text-foreground hover:text-emerald-400 transition-colors">
                        {item.title}
                      </Link>
                      <p className="text-[10px] text-muted-foreground">{item.category}</p>
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-400">{item.reward}</td>

                    <td className="p-4 text-center font-bold text-foreground">{item.applicantsCount}</td>

                    <td className="p-4 text-center font-bold text-emerald-400">{item.acceptedCount} / {item.totalSlots}</td>

                    <td className="p-4 text-center font-bold text-emerald-400">{item.completedCount}</td>

                    <td className="p-4 font-mono font-bold text-foreground">{item.totalSpent}</td>

                    <td className="p-4 text-muted-foreground">{item.createdAt}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(item.id)}
                          className="p-1.5 rounded-lg border border-border hover:border-muted bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title={item.status === "Live" ? "Pause Campaign" : "Resume Campaign"}
                        >
                          <HugeiconsIcon icon={item.status === "Live" ? PauseIcon : PlayIcon} size={14} />
                        </button>

                        <Link
                          href={`/hirer/opportunities/${item.id}`}
                          className="p-1.5 rounded-lg border border-border hover:border-muted bg-card text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details"
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
