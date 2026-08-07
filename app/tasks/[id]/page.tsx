"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkBadge01Icon,
  StarIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Location01Icon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  UserGroupIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { MOCK_TASKS, type MarketplaceTask } from "@/lib/marketplace/mock-tasks";
import { PhoneGateModal } from "@/components/auth/phone-gate-modal";
import { usePhoneGate } from "@/hooks/use-phone-gate";
import { zolanzoEngine } from "@/lib/engine/business-engine";

interface OpportunityDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function OpportunityDetailsPage({ params }: OpportunityDetailsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isOpen, actionName, triggerGate, handleVerified, handleClose } = usePhoneGate();

  const task: MarketplaceTask = MOCK_TASKS.find((t) => t.id === resolvedParams.id) || MOCK_TASKS[0]!;

  const handleApply = () => {
    triggerGate(`Apply for "${task.title}"`, async () => {
      try {
        await zolanzoEngine.applyToOpportunity("WORKER_100", task.id, task.title, task.reward, 850);
      } catch {
        // Fallback
      }
      router.push(`/tasks/${task.id}/work`);
    });
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      {/* Security Phone Verification Gate */}
      <PhoneGateModal
        isOpen={isOpen}
        actionName={actionName}
        onVerified={handleVerified}
        onClose={handleClose}
      />

      <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back to Opportunities
          </Link>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            ● Active Opportunity
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold">
                  {task.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified Business
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{task.title}</h1>
            </div>

            {/* Dominated Payout */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl shrink-0 text-left sm:text-right">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Reward Payout</span>
              <span className="text-3xl font-black text-emerald-400 tracking-tight">{task.reward}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Est. Duration</span>
              <div className="flex items-center gap-1.5 text-white font-bold">
                <HugeiconsIcon icon={Clock01Icon} size={16} className="text-emerald-400" />
                <span>{task.estimatedTime}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Difficulty Level</span>
              <span className="text-white font-bold block">{task.difficulty}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Slots Available</span>
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <HugeiconsIcon icon={UserGroupIcon} size={16} />
                <span>{task.availableSlots} / {task.totalSlots}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Location</span>
              <div className="flex items-center gap-1 text-zinc-300 font-bold">
                <HugeiconsIcon icon={Location01Icon} size={16} />
                <span className="truncate">{task.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description & Deliverables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Opportunity Overview</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{task.shortDescription}</p>
            </div>

            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Requirements</h3>
              <ul className="space-y-3">
                {task.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-zinc-300">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-emerald-400 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Approval & Review Timeline</h3>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                <HugeiconsIcon icon={Shield01Icon} size={20} className="text-emerald-400 shrink-0" />
                <p>
                  Submissions are reviewed by <strong className="text-white">{task.employerName}</strong> within <strong>6 to 24 hours</strong>. Funds are locked in escrow and released automatically upon approval.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Hirer Card & Sticky Apply */}
          <div className="space-y-6">
            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-bold">
                {task.employerName.substring(0, 2).toUpperCase()}
              </div>

              <div>
                <h4 className="text-base font-bold text-white">{task.employerName}</h4>
                <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-xs mt-1">
                  <HugeiconsIcon icon={StarIcon} size={14} className="fill-amber-400" />
                  <span>{task.employerRating} Verified Rating</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-left text-xs space-y-1">
                <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Trust Record</span>
                <p className="text-zinc-300 font-medium">100% Escrow Funded • 98.6% Prompt Approval</p>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for Opportunity</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-emerald-400" />
                <span>Zero Fee Application</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Earners never pay to apply for opportunities on ZOLANZO. All earnings go directly to your wallet.
              </p>
            </div>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
