"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  CircleLock01Icon,
  Shield01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { zolanzoEngine } from "@/lib/engine/business-engine";

let campaignCounter = 1000;
function getNextCampaignId() {
  campaignCounter += 1;
  return `opp_${campaignCounter}`;
}

export default function CreateOpportunityPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1: Core Specs
  const [title, setTitle] = useState("Fintech Usability Testing & Feedback");
  const [category, setCategory] = useState("Research");
  const [rewardPerSlot, setRewardPerSlot] = useState("1200");
  const [slots, setSlots] = useState("500");
  const [duration, setDuration] = useState("15 mins");
  const [difficulty, setDifficulty] = useState("Intermediate");

  // Step 2: Content & Instructions
  const [description, setDescription] = useState("Test the new transfer flow and provide feedback on app speed and UI clarity.");
  const [requirements, setRequirements] = useState("Must reside in Nigeria, have active mobile banking app.");
  const [instructions, setInstructions] = useState("Upload 2 screenshots of completed transfer receipt & answer 3 feedback questions.");

  // Step 3: Targeting
  const [countries, setCountries] = useState("Nigeria, Ghana, Kenya");
  const [languages, setLanguages] = useState("English");
  const [isFeatured, setIsFeatured] = useState(true);

  // Calculations
  const rewardNum = parseInt(rewardPerSlot || "0", 10);
  const slotsNum = parseInt(slots || "0", 10);
  const subtotalEscrow = rewardNum * slotsNum;
  const platformFee = Math.round(subtotalEscrow * 0.1); // 10% platform fee
  const totalEscrowRequired = subtotalEscrow + platformFee;
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    const campaignId = getNextCampaignId();
    try {
      await zolanzoEngine.lockCampaignEscrow(campaignId, "EMPLOYER_100", subtotalEscrow, platformFee);
    } catch {
      // Fallback
    }
    setPublishing(false);
    router.push("/hire/opportunities");
  };

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[800px] mx-auto space-y-6 pb-20">
        
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <Link
            href="/hire/opportunities"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back to Opportunities
          </Link>

          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} /> Autosaved just now
          </span>
        </div>

        {/* Builder Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create New Opportunity
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Multi-step campaign builder with automated escrow funding and instant worker targeting.
          </p>
        </div>

        {/* 4 Steps Indicator Bar */}
        <div className="grid grid-cols-4 gap-2 border-b border-white/10 pb-4">
          {[
            { n: 1, label: "Core Specs" },
            { n: 2, label: "Instructions" },
            { n: 3, label: "Targeting" },
            { n: 4, label: "Escrow & Review" },
          ].map((s) => (
            <div
              key={s.n}
              onClick={() => s.n < step && setStep(s.n)}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                step === s.n
                  ? "bg-purple-600/20 border-purple-500 text-white font-bold"
                  : step > s.n
                  ? "bg-zinc-900 border-emerald-500/40 text-emerald-400 font-bold"
                  : "bg-zinc-900/60 border-zinc-800 text-zinc-500"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block">Step {s.n}</span>
              <span className="text-xs block truncate">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step Form Box */}
        <form onSubmit={handlePublish} className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          
          {step === 1 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Step 1: Campaign Specifications</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Opportunity Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-xs font-bold focus:outline-none"
                  >
                    <option>AI Data</option>
                    <option>Research</option>
                    <option>Support</option>
                    <option>Testing</option>
                    <option>Social Media</option>
                    <option>Writing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Reward Per Completed Slot (₦)</label>
                  <input
                    type="number"
                    required
                    value={rewardPerSlot}
                    onChange={(e) => setRewardPerSlot(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Available Slots</label>
                  <input
                    type="number"
                    required
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm font-bold font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Est. Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-xs font-bold focus:outline-none"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Expert</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-[44px] px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Step 2</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Step 2: Content & Submission Instructions</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Opportunity Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Worker Requirements</label>
                <textarea
                  rows={2}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Submission Proof Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-[44px] px-6 rounded-xl border border-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-[44px] px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Step 3</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Step 3: Location & Visibility Targeting</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Countries</label>
                <input
                  type="text"
                  value={countries}
                  onChange={(e) => setCountries(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Required Languages</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-white text-sm focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Promote as Featured Opportunity</p>
                  <p className="text-[10px] text-zinc-400">Boosts visibility on the Earn Marketplace homepage.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded text-purple-600"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-[44px] px-6 rounded-xl border border-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="h-[44px] px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Escrow & Funding</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-left">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HugeiconsIcon icon={CircleLock01Icon} size={18} className="text-purple-400" />
                Step 4: Campaign Escrow Lock & Final Review
              </h3>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Reward Subtotal ({slotsNum} slots × ₦{rewardNum.toLocaleString()})</span>
                  <span className="text-white font-mono font-bold">₦{subtotalEscrow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Platform Escrow Fee (10%)</span>
                  <span className="text-white font-mono font-bold">₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-purple-400 font-bold">Total Required Escrow Lock</span>
                  <span className="text-emerald-400 font-mono font-black text-lg">₦{totalEscrowRequired.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-zinc-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <HugeiconsIcon icon={Shield01Icon} size={16} />
                  <span>Escrow Guarantee Protection</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Funds are locked safely in ZOLANZO Escrow and released only when you approve submitted worker evidence. Unused escrow is refunded to your wallet upon campaign completion.
                </p>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-[48px] px-6 rounded-xl border border-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={publishing}
                  className="h-[48px] px-8 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {publishing ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Lock Escrow & Publish Campaign</span>
                      <HugeiconsIcon icon={Coins01Icon} size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>

      </div>
    </AppShell>
  );
}
