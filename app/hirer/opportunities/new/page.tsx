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
    router.push("/hirer/opportunities");
  };

  return (
    <AppShell userName="Campaign Manager" avatarUrl="/brand/lady1.png">
      <div className="max-w-[800px] mx-auto space-y-6 pb-20">
        {/* Navigation Top */}
        <div className="flex items-center justify-between">
          <Link
            href="/hirer/opportunities"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back to Opportunities
          </Link>

          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} /> Autosaved just now
          </span>
        </div>

        {/* Builder Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Create New Opportunity
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Multi-step campaign builder with automated escrow funding and instant earner targeting.
          </p>
        </div>

        {/* 4 Steps Indicator Bar */}
        <div className="grid grid-cols-4 gap-2 border-b border-border pb-4">
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
                  ? "bg-emerald-600/20 border-emerald-500 text-foreground font-bold"
                  : step > s.n
                  ? "bg-muted/40 border-emerald-500/40 text-emerald-400 font-bold"
                  : "bg-muted/20 border-border text-muted-foreground"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block">Step {s.n}</span>
              <span className="text-xs block truncate">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step Form Box */}
        <form onSubmit={handlePublish} className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {step === 1 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Step 1: Campaign Specifications</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Opportunity Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-xs font-bold focus:outline-none"
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
                  <label className="text-xs font-semibold text-foreground">Reward Per Completed Slot (₦)</label>
                  <input
                    type="number"
                    required
                    value={rewardPerSlot}
                    onChange={(e) => setRewardPerSlot(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Available Slots</label>
                  <input
                    type="number"
                    required
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm font-bold font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Est. Duration</label>
                  <input
                    type="text"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-xs font-bold focus:outline-none"
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
                  className="h-[44px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Step 2</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Step 2: Content & Submission Instructions</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Opportunity Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Earner Requirements</label>
                <textarea
                  rows={2}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full p-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Submission Proof Instructions</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-xs focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="h-[44px] px-6 rounded-xl border border-border text-muted-foreground font-bold text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-[44px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Step 3</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Step 3: Location & Visibility Targeting</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Countries</label>
                <input
                  type="text"
                  value={countries}
                  onChange={(e) => setCountries(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Required Languages</label>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="w-full h-[48px] px-4 rounded-xl bg-muted/40 border border-border focus:border-emerald-500 text-foreground text-sm focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Promote as Featured Opportunity</p>
                  <p className="text-[10px] text-muted-foreground">Boosts visibility on the Earn Marketplace homepage.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-[44px] px-6 rounded-xl border border-border text-muted-foreground font-bold text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="h-[44px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Review Escrow & Funding</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-left">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <HugeiconsIcon icon={CircleLock01Icon} size={18} className="text-emerald-400" />
                Step 4: Campaign Escrow Lock & Final Review
              </h3>

              <div className="bg-muted/40 border border-border p-6 rounded-2xl space-y-3">
                <div className="flex justify-between text-xs border-b border-border pb-2">
                  <span className="text-muted-foreground">Reward Subtotal ({slotsNum} slots × ₦{rewardNum.toLocaleString()})</span>
                  <span className="text-foreground font-mono font-bold">₦{subtotalEscrow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-border pb-2">
                  <span className="text-muted-foreground">Platform Escrow Fee (10%)</span>
                  <span className="text-foreground font-mono font-bold">₦{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-emerald-400 font-bold">Total Required Escrow Lock</span>
                  <span className="text-emerald-400 font-mono font-black text-lg">₦{totalEscrowRequired.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <HugeiconsIcon icon={Shield01Icon} size={16} />
                  <span>Escrow Guarantee Protection</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Funds are locked safely in ZOLANZO Escrow and released only when you approve submitted earner evidence. Unused escrow is refunded to your wallet upon campaign completion.
                </p>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="h-[48px] px-6 rounded-xl border border-border text-muted-foreground font-bold text-xs cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={publishing}
                  className="h-[48px] px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
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
