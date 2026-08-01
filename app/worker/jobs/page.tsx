"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icon-registry";
import { BrandIcon, BrandType } from "@/components/ui/brand-icons";

export default function WorkerJobsPage() {
  const [search, setSearch] = useState("");

  const jobs = [
    { id: "1", title: "Instagram Content Moderation", cat: "Social Media", pay: "$4.50", brand: "instagram" as BrandType, time: "15 mins" },
    { id: "2", title: "TikTok Video Tagging & Captions", cat: "Content Creation", pay: "$6.00", brand: "tiktok" as BrandType, time: "20 mins" },
    { id: "3", title: "YouTube Video Audio Transcription", cat: "Translation", pay: "$8.20", brand: "youtube" as BrandType, time: "30 mins" },
    { id: "4", title: "Translate Swahili Audio Snippets", cat: "Translation", pay: "$15.00", brand: "telegram" as BrandType, time: "45 mins" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6 max-w-6xl mx-auto text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Browse Open Micro-Jobs</h1>
          <p className="text-zinc-400">Escrow-guaranteed payouts across Africa</p>
        </div>
        <Link href="/worker/dashboard" className="text-emerald-400 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="relative">
        <Icons.search size={16} className="absolute left-3.5 top-3 text-zinc-400" />
        <input
          type="text"
          placeholder="Filter jobs by title or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between hover:border-emerald-500 transition-all">
            <div className="flex items-center gap-4">
              <BrandIcon brand={j.brand} size={40} background="soft" />
              <div>
                <h3 className="font-bold text-sm text-zinc-200">{j.title}</h3>
                <div className="flex items-center gap-3 text-zinc-400 mt-1">
                  <span>{j.cat}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Icons.clock size={12} /> {j.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-base font-extrabold text-emerald-400">{j.pay}</span>
              <Link
                href={`/worker/jobs/${j.id}`}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold min-h-[44px] flex items-center justify-center"
              >
                View & Accept
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
