"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  File01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { ApplicationTimeline, type ApplicationStatus } from "@/components/applications/application-timeline";

export interface ApplicationItem {
  id: string;
  title: string;
  employer: string;
  reward: string;
  status: ApplicationStatus;
  submittedDate: string;
  reviewTimeline: string;
  taskId: string;
  evidenceNotes?: string;
  payoutRef?: string;
}

interface ApplicationDetailsModalProps {
  application: ApplicationItem | null;
  onClose: () => void;
}

export function ApplicationDetailsModal({ application, onClose }: ApplicationDetailsModalProps) {
  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[580px] bg-[#0A0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative text-white space-y-6 max-h-[90vh] overflow-y-auto">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              {application.employer}
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-emerald-400" /> Verified
            </span>
          </div>
          <h3 className="text-lg font-black text-white">{application.title}</h3>
          <p className="text-xs text-[#008744] font-bold">Escrow Reward: {application.reward}</p>
        </div>

        {/* Application Timeline State Machine */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <ApplicationTimeline currentStatus={application.status} />
        </div>

        {/* Submitted Evidence & Review Notes */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Submitted Evidence</h4>
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-bold">
              <HugeiconsIcon icon={File01Icon} size={16} className="text-emerald-400" />
              <span>Evidence Summary</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              {application.evidenceNotes || "Completed 15 AI dataset image annotations with bounding box accuracy score > 98%. Proof screenshots attached to escrow submission."}
            </p>
          </div>
        </div>

        {/* Action Footers */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">Ref: {application.payoutRef || "TX_90182410"}</span>

          <Link
            href={`/tasks/${application.taskId}`}
            onClick={onClose}
            className="h-[38px] px-4 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>View Opportunity</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
