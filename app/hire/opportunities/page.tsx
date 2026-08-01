"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Search01Icon,
  PencilEdit01Icon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

type OpportunityStatus = "Live" | "Draft" | "Paused" | "Completed" | "Archived";

interface OpportunityItem {
  id: string;
  title: string;
  category: string;
  reward: string;
  applicantsCount: number;
  acceptedCount: number;
  completedCount: number;
  totalSlots: number;
  totalSpent: string;
  createdAt: string;
  status: OpportunityStatus;
}

export default function MyOpportunitiesPage() {
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [items, setItems] = useState<OpportunityItem[]>([
    {
      id: "opp_101",
      title: "AI Model Image Dataset Annotation",
      category: "AI Data",
      reward: "₦850",
      applicantsCount: 850,
      acceptedCount: 850,
      completedCount: 850,
      totalSlots: 1000,
      totalSpent: "₦722,500",
      createdAt: "Today",
      status: "Live",
    },
    {
      id: "opp_102",
      title: "Mobile Banking Usability & Feedback Survey",
      category: "Research",
      reward: "₦1,200",
      applicantsCount: 310,
      acceptedCount: 210,
      completedCount: 210,
      totalSlots: 500,
      totalSpent: "₦252,000",
      createdAt: "Yesterday",
      status: "Live",
    },
    {
      id: "opp_103",
      title: "Customer Support Live Chat Assistance",
      category: "Support",
      reward: "₦5,000",
      applicantsCount: 45,
      acceptedCount: 10,
      completedCount: 8,
      totalSlots: 20,
      totalSpent: "₦40,000",
      createdAt: "3 days ago",
      status: "Paused",
    },
    {
      id: "opp_104",
      title: "Social Media App Beta User Experience Testing",
      category: "Testing",
      reward: "₦3,500",
      applicantsCount: 150,
      acceptedCount: 150,
      completedCount: 150,
      totalSlots: 150,
      totalSpent: "₦525,000",
      createdAt: "Last week",
      status: "Completed",
    },
  ]);

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus: OpportunityStatus = item.status === "Live" ? "Paused" : "Live";
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || item.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                My Opportunities
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                {items.length} Total Campaigns
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Manage campaign budgets, pause/resume recruitment, and review worker completion rates.
            </p>
          </div>

          <Link
            href="/hire/opportunities/new"
            className="h-[44px] px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
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
              placeholder="Search opportunities..."
              className="w-full h-[38px] pl-9 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View / Mobile Card View */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                    
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
                      <Link href={`/hire/opportunities/${item.id}`} className="font-bold text-white hover:text-purple-400 transition-colors">
                        {item.title}
                      </Link>
                      <p className="text-[10px] text-zinc-500">{item.category}</p>
                    </td>

                    <td className="p-4 font-mono font-bold text-emerald-400">{item.reward}</td>

                    <td className="p-4 text-center font-bold text-zinc-300">{item.applicantsCount}</td>

                    <td className="p-4 text-center font-bold text-purple-400">{item.acceptedCount} / {item.totalSlots}</td>

                    <td className="p-4 text-center font-bold text-emerald-400">{item.completedCount}</td>

                    <td className="p-4 font-mono font-bold text-white">{item.totalSpent}</td>

                    <td className="p-4 text-zinc-400">{item.createdAt}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleStatus(item.id)}
                          className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
                          title={item.status === "Live" ? "Pause Campaign" : "Resume Campaign"}
                        >
                          <HugeiconsIcon icon={item.status === "Live" ? PauseIcon : PlayIcon} size={14} />
                        </button>

                        <Link
                          href={`/hire/opportunities/${item.id}`}
                          className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white transition-colors"
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
