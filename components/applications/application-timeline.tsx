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
  timestamp?: string;
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
  appliedAt,
  submittedAt,
  approvedAt,
  paidAt,
}: ApplicationTimelineProps) {
  const steps: LifecycleStep[] = [
    {
      status: "Applied",
      title: "Applied",
      explanation: "The assignment was claimed.",
      timestamp: appliedAt,
      isCompleted: true,
      isCurrent: currentStatus === "Applied",
    },
    {
      status: "In Progress",
      title: "In progress",
      explanation: "Work has started.",
      timestamp: appliedAt,
      isCompleted: ["In Progress", "Submitted", "Awaiting Review", "Approved", "Paid"].includes(currentStatus),
      isCurrent: currentStatus === "In Progress",
    },
    {
      status: "Submitted",
      title: "Submitted",
      explanation: "Proof was submitted for review.",
      timestamp: submittedAt,
      isCompleted: ["Submitted", "Awaiting Review", "Approved", "Paid"].includes(currentStatus),
      isCurrent: currentStatus === "Submitted" || currentStatus === "Awaiting Review",
    },
    {
      status: "Approved",
      title: "Approved",
      explanation: "The hirer approved the submission.",
      timestamp: approvedAt,
      isCompleted: ["Approved", "Paid"].includes(currentStatus),
      isCurrent: currentStatus === "Approved",
    },
    {
      status: "Paid",
      title: "Paid",
      explanation: "The reward was credited to the wallet.",
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Status</h4>
        <span className="px-2.5 py-0.5 rounded-full bg-primary-subtle text-primary text-[10px] font-bold border border-primary/25">
          {currentStatus}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {steps.map((step) => {
          const Icon = getStatusIcon(step.status);
          return (
            <div key={step.status} className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border ${
                  step.isCurrent
                    ? "bg-primary text-primary-foreground border-primary"
                    : step.isCompleted
                      ? "bg-primary-subtle text-primary border-primary/25"
                      : "bg-card text-muted-foreground border-border"
                }`}
              >
                <HugeiconsIcon icon={Icon} size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${step.isCurrent || step.isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                  {step.timestamp ? (
                    <span className="text-[10px] text-muted-foreground shrink-0">{step.timestamp}</span>
                  ) : null}
                </div>
                <p className="text-[11px] text-foreground leading-snug">{step.explanation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
