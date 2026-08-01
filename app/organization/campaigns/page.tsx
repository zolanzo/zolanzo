import React from "react";
import Link from "next/link";
import { BrandIcon, BrandType } from "@/components/ui/brand-icons";

export default function OrganizationCampaignsPage() {
  const campaigns = [
    { title: "Instagram Content Moderation & Tagging", brand: "instagram" as BrandType, budget: "$500.00", completed: "340/500", status: "Active" },
    { title: "TikTok Caption & Hashtag Verification", brand: "tiktok" as BrandType, budget: "$800.00", completed: "620/1000", status: "Active" },
    { title: "YouTube Video Audio Transcription", brand: "youtube" as BrandType, budget: "$1,200.00", completed: "1200/1200", status: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Campaigns & Micro-Task Jobs</h1>
          <p className="text-zinc-400">Manage worker deployments and campaign budgets</p>
        </div>
        <Link href="/organization/campaigns/new" className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold min-h-[44px] flex items-center justify-center">
          + Create Campaign
        </Link>
      </div>

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.title} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandIcon brand={c.brand} size={36} background="soft" />
              <div>
                <div className="font-bold text-sm text-zinc-200">{c.title}</div>
                <div className="text-[10px] text-zinc-400">Progress: {c.completed} • Status: {c.status}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-extrabold text-emerald-400">{c.budget}</span>
              <Link href="/organization/reviews" className="px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-200 font-bold">
                Review Proofs
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
