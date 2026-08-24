"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, File01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-detail-title"
        className="w-full max-w-[580px] bg-card border border-border rounded-t-2xl sm:rounded-2xl p-4 shadow-floating relative space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-foreground p-2 min-h-11 min-w-11"
          aria-label="Close"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </button>

        <div className="space-y-1 pr-10">
          <h3 id="application-detail-title" className="text-base font-black text-foreground">
            {application.title}
          </h3>
          {application.reward ? (
            <p className="text-xs text-primary font-bold">{application.reward}</p>
          ) : null}
        </div>

        <div className="p-3 rounded-2xl bg-muted border border-border">
          <ApplicationTimeline currentStatus={application.status} />
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Evidence</h4>
          <div className="p-3 rounded-2xl bg-card border border-border space-y-2 text-xs">
            <div className="flex items-center gap-2 text-foreground font-bold">
              <HugeiconsIcon icon={File01Icon} size={16} className="text-primary" />
              <span>Submission</span>
            </div>
            <p className="text-foreground leading-relaxed">
              {application.evidenceNotes || "No evidence notes recorded."}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-end">
          <Link
            href={`/tasks/${application.taskId}`}
            onClick={onClose}
            className="h-11 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
          >
            <span>View task</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
