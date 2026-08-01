"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandIcon } from "@/components/ui/brand-icons";
import { Icons } from "@/lib/icon-registry";

export default function ActiveJobsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [proofText, setProofText] = useState("");

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-5xl mx-auto space-y-6 text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold">Active Tasks & Proof Submission</h1>
          <p className="text-zinc-400">Complete tasks and submit proof for employer review</p>
        </div>
        <Link href="/worker/dashboard" className="text-emerald-400 font-bold hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon brand="instagram" size={40} background="soft" />
            <div>
              <h2 className="font-bold text-sm">Instagram Content Moderation & Tagging</h2>
              <span className="text-emerald-400 font-mono text-[11px]">Time remaining: 24 mins</span>
            </div>
          </div>
          <span className="text-lg font-black text-emerald-400">$4.50</span>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Icons.verified size={24} />
            </div>
            <h3 className="font-bold text-sm">Proof Submitted Successfully!</h3>
            <p className="text-zinc-400">The employer will review your proof within 4 hours. Funds are locked in escrow.</p>
            <Link
              href="/worker/jobs/completed"
              className="inline-block px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-bold min-h-[44px]"
            >
              View Task History
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitProof} className="space-y-4 pt-2">
            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Proof Notes / Links</label>
              <textarea
                required
                rows={3}
                placeholder="Paste Instagram post URL, proof notes, or handle used for moderation..."
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-zinc-300">Upload Screenshot / Evidence</label>
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950 text-center cursor-pointer hover:border-emerald-500">
                <Icons.paperclip size={20} className="mx-auto text-zinc-400 mb-1" />
                <span className="text-zinc-400">Click to upload screenshot PNG/JPG</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold transition-all shadow-md min-h-[44px]"
            >
              Submit Proof for $4.50 Escrow Release
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
