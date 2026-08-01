"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandIcon } from "@/components/ui/brand-icons";
import { Icons } from "@/lib/icon-registry";

export default function JobDetailPage() {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => {
      window.location.href = "/worker/jobs/active";
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <Link href="/worker/jobs" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
          <Icons.back size={14} /> Back to Job Feed
        </Link>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
          <Icons.escrow size={14} className="inline mr-1" /> Escrow Protected
        </span>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandIcon brand="instagram" size={48} background="glass" />
            <div>
              <h1 className="text-lg font-bold">Instagram Content Moderation & Tagging</h1>
              <p className="text-zinc-400">Posted by Global Media Corp • Escrow Funding Verified</p>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">$4.50</div>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="font-bold uppercase tracking-wider text-zinc-400">Task Briefing</h3>
          <p className="text-zinc-300 leading-relaxed">
            Review 10 Instagram post assets for community guideline compliance. Verify image tags, report inappropriate content, and confirm hashtags match the brand guidelines.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold uppercase tracking-wider text-zinc-400">Requirements</h3>
          <ul className="space-y-1.5 text-zinc-300">
            <li className="flex items-center gap-2"><Icons.verified size={14} className="text-emerald-400" /> Active Instagram Account</li>
            <li className="flex items-center gap-2"><Icons.verified size={14} className="text-emerald-400" /> Screenshot proof of completed moderation tags</li>
            <li className="flex items-center gap-2"><Icons.verified size={14} className="text-emerald-400" /> Completed within 30 minutes</li>
          </ul>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-zinc-400 font-mono">Job Reference: JOB_INSTA_8841</span>
          <button
            onClick={handleAccept}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all shadow-md min-h-[44px]"
          >
            {accepted ? "Accepting Task..." : "Accept Job & Start Work"}
          </button>
        </div>
      </div>
    </div>
  );
}
