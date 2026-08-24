"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ArrowRight01Icon,
  Upload01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useCapabilities } from "@/lib/capabilities-service";

export interface SimpleTaskItem {
  id: string;
  name: string;
  platform:
    | "TikTok"
    | "Instagram"
    | "Facebook"
    | "YouTube"
    | "WhatsApp"
    | "Telegram"
    | "Threads"
    | "X"
    | "LinkedIn"
    | "Website"
    | "Referral"
    | "Offline";
  reward: string;
  rewardNumeric: number;
  instructions: string;
  proofRequired: string;
  estimatedMinutes?: number;
}

export const LAUNCH_CATEGORIES = [
  "TikTok",
  "Instagram",
  "Facebook",
  "YouTube",
  "WhatsApp",
  "Telegram",
  "Threads",
  "X",
  "LinkedIn",
  "Website",
  "Referral",
  "Offline",
] as const;

export const SIMPLE_TASKS: SimpleTaskItem[] = [];

interface TaskDrawerProps {
  task: SimpleTaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (task: SimpleTaskItem) => void;
}

export function TaskDrawer({ task, isOpen, onClose, onSubmitted }: TaskDrawerProps) {
  const { getTaskAccess } = useCapabilities();
  const [step, setStep] = useState<"detail" | "proof" | "submitted">("detail");
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen || !task) return null;

  const access = getTaskAccess(task.platform);

  const handleStart = () => {
    setStep("proof");
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("submitted");
    onSubmitted?.(task);
  };

  const handleDone = () => {
    setStep("detail");
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-overlay backdrop-blur-sm">
      <div className="w-full max-w-md bg-elevated border-l border-border h-full p-6 flex flex-col justify-between overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
              <SocialBrandIcon platform={task.platform} size={20} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground leading-tight">{task.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${access.badgeColorClass}`}>
                  {access.badgeText}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{task.platform}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="p-1.5 rounded-xl bg-muted hover:bg-hover text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {step === "detail" && (
          <div className="space-y-6 flex-1">
            <div className="bg-muted border border-border rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reward</span>
              <span className="text-2xl font-black text-primary">{task.reward}</span>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Instructions</h4>
              <p className="text-xs text-muted-foreground bg-muted p-4 rounded-xl border border-border">
                {task.instructions}
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Proof Required</h4>
              <p className="text-xs text-muted-foreground bg-muted p-3.5 rounded-xl border border-border">
                {task.proofRequired}
              </p>
            </div>
          </div>
        )}

        {step === "proof" && (
          <form onSubmit={handleSubmitProof} className="space-y-6 flex-1">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Upload Proof</h4>
              <p className="text-xs text-muted-foreground">{task.proofRequired}</p>
            </div>
            <div className="space-y-3 rounded-2xl border-2 border-dashed border-border bg-muted p-6 text-center hover:border-primary/60">
              <HugeiconsIcon icon={Upload01Icon} size={28} className="text-primary mx-auto" />
              <label htmlFor="proof-file" className="text-xs font-bold text-foreground cursor-pointer hover:underline block">
                {file ? file.name : "Choose screenshot or file"}
              </label>
              <input
                id="proof-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
            <button
              type="submit"
              disabled={!file}
              className="w-full h-[46px] rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span>Submit Proof</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </form>
        )}

        {step === "submitted" && (
          <div className="text-center space-y-4 my-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Proof submitted</h3>
              <p className="text-xs text-muted-foreground">Your submission is in review.</p>
            </div>
            <button
              type="button"
              onClick={handleDone}
              className="w-full h-[44px] rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Done
            </button>
          </div>
        )}

        {step === "detail" && (
          <button
            type="button"
            onClick={handleStart}
            className="w-full h-[46px] rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>Start Task</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
