"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  Cancel01Icon,
  Coins01Icon,
  CheckmarkBadge01Icon,
  CursorPointer01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";

export type ApplicationStatus =
  | "Applied"
  | "Accepted"
  | "In Progress"
  | "Submitted"
  | "Awaiting Review"
  | "Approved"
  | "Rejected"
  | "Paid";

export interface LifecycleStep {
  status: ApplicationStatus;
  title: string;
  explanation: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface ApplicationTimelineProps {
  currentStatus: ApplicationStatus;
  appliedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
}

export function ApplicationTimeline({
  currentStatus,
  appliedAt = "Today • 10:42 AM",
  submittedAt = "Today • 11:15 AM",
  approvedAt = "Today • 2:30 PM",
  paidAt = "Today • 2:31 PM",
}: ApplicationTimelineProps) {
  const steps: LifecycleStep[] = [
    {
      status: "Applied",
      title: "Application Received",
      explanation: "Opportunity slot reserved in platform queue.",
      timestamp: appliedAt,
      isCompleted: true,
      isCurrent: currentStatus === "Applied",
    },
    {
      status: "In Progress",
      title: "Work in Progress",
      explanation: "Workspace active. Instructions being completed.",
      timestamp: appliedAt,
      isCompleted: ["In Progress", "Submitted", "Awaiting Review", "Approved", "Paid"].includes(currentStatus),
      isCurrent: currentStatus === "In Progress",
    },
    {
      status: "Submitted",
      title: "Evidence Submitted",
      explanation: "Proof uploaded and locked in escrow.",
      timestamp: submittedAt,
      isCompleted: ["Submitted", "Awaiting Review", "Approved", "Paid"].includes(currentStatus),
      isCurrent: currentStatus === "Submitted" || currentStatus === "Awaiting Review",
    },
    {
      status: "Approved",
      title: "Hirer Approved",
      explanation: "Quality score verified by hirer.",
      timestamp: approvedAt,
      isCompleted: ["Approved", "Paid"].includes(currentStatus),
      isCurrent: currentStatus === "Approved",
    },
    {
      status: "Paid",
      title: "Wallet Credited",
      explanation: "Escrow funds disbursed directly to wallet.",
      timestamp: paidAt,
      isCompleted: currentStatus === "Paid",
      isCurrent: currentStatus === "Paid",
    },
  ];

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "Applied": return CursorPointer01Icon;
      case "In Progress": return Clock01Icon;
      case "Submitted": return File01Icon;
      case "Approved": return CheckmarkBadge01Icon;
      case "Paid": return Coins01Icon;
      case "Rejected": return Cancel01Icon;
      default: return CheckmarkCircle01Icon;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Application State Machine</h4>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
          Status: {currentStatus}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
        {steps.map((step, idx) => {
          const Icon = getStatusIcon(step.status);
          return (
            <div key={idx} className="relative flex items-start gap-3.5 group">
              {/* Timeline Bullet */}
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  step.isCurrent
                    ? "bg-[#008744] text-white border-emerald-400 ring-4 ring-[#008744]/20 animate-pulse"
                    : step.isCompleted
                    ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                    : "bg-zinc-900 text-zinc-600 border-zinc-800"
                }`}
              >
                <HugeiconsIcon icon={Icon} size={12} />
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${step.isCurrent ? "text-emerald-400" : step.isCompleted ? "text-white" : "text-zinc-500"}`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{step.timestamp}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{step.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
