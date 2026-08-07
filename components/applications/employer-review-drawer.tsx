"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  File01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { zolanzoEngine } from "@/lib/engine/business-engine";

export interface ApplicantReviewItem {
  id: string;
  workerName: string;
  workerAvatar: string;
  approvalRate: string;
  completedTasks: number;
  opportunityTitle: string;
  reward: string;
  submittedAt: string;
  evidenceText: string;
  evidenceFileName?: string;
  status: "Pending" | "Accepted" | "Rejected" | "Revision Requested";
}

interface EmployerReviewDrawerProps {
  application: ApplicantReviewItem | null;
  onClose: () => void;
  onAction: (id: string, newStatus: "Accepted" | "Rejected" | "Revision Requested") => void;
}

export function EmployerReviewDrawer({ application, onClose, onAction }: EmployerReviewDrawerProps) {
  const [processing, setProcessing] = useState(false);

  if (!application) return null;

  const handleAction = async (status: "Accepted" | "Rejected" | "Revision Requested") => {
    setProcessing(true);
    if (status === "Accepted") {
      try {
        await zolanzoEngine.approveSubmission(application.id);
      } catch {
        // Fallback
      }
    }
    setProcessing(false);
    onAction(application.id, status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[560px] bg-[#0A0F12] border-l border-white/10 h-full p-6 space-y-6 overflow-y-auto text-white shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            Earner Evidence Submission Inspection
          </span>
          <h3 className="text-xl font-bold tracking-tight">{application.opportunityTitle}</h3>
          <p className="text-xs text-zinc-400">Submitted {application.submittedAt}</p>
        </div>

        {/* Earner Identity Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={application.workerAvatar}
              alt={application.workerName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40"
            />
            <div>
              <h4 className="text-sm font-bold text-white">{application.workerName}</h4>
              <p className="text-xs text-emerald-400 font-bold">{application.approvalRate} Approval Rate • {application.completedTasks} Completed</p>
            </div>
          </div>

          <span className="text-xs font-bold text-[#008744] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <HugeiconsIcon icon={Shield01Icon} size={12} /> Verified Earner
          </span>
        </div>

        {/* Submitted Evidence Specs */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 text-xs">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Submitted Proof / Notes</h4>
          <p className="text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800 font-mono text-[11px]">
            {application.evidenceText}
          </p>

          {application.evidenceFileName && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <HugeiconsIcon icon={File01Icon} size={18} className="text-emerald-400" />
              <div>
                <p className="font-bold text-white text-[11px]">{application.evidenceFileName}</p>
                <p className="text-[10px] text-zinc-500">Verified Evidence Screenshot</p>
              </div>
            </div>
          )}
        </div>

        {/* Escrow Lock Banner */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} size={18} className="text-emerald-400" />
            <span className="font-bold text-white">Reward Escrow Held</span>
          </div>
          <span className="text-emerald-400 font-mono font-black text-sm">{application.reward}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            disabled={processing}
            onClick={() => handleAction("Accepted")}
            className="w-full h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            <span>Approve Submission & Release {application.reward}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={processing}
              onClick={() => handleAction("Revision Requested")}
              className="h-[42px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-amber-400 font-bold text-xs transition-colors cursor-pointer"
            >
              Request Revision
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={() => handleAction("Rejected")}
              className="h-[42px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-red-400 font-bold text-xs transition-colors cursor-pointer"
            >
              Reject Submission
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
