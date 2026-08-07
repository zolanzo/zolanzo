"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ArrowRight01Icon,
  TiktokIcon,
  InstagramIcon,
  Facebook01Icon,
  YoutubeIcon,
  GlobalSearchIcon,
  TelegramIcon,
  WhatsappIcon,
  Linkedin01Icon,
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
  icon: typeof TiktokIcon;
  instructions: string;
  proofRequired: string;
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

export const SIMPLE_TASKS: SimpleTaskItem[] = [
  {
    id: "st_1",
    name: "TikTok Follow",
    platform: "TikTok",
    reward: "₦30",
    rewardNumeric: 30,
    icon: TiktokIcon,
    instructions: "Follow @zolanzo_app on TikTok.",
    proofRequired: "Screenshot showing 'Following' status",
  },
  {
    id: "st_2",
    name: "Instagram Like",
    platform: "Instagram",
    reward: "₦20",
    rewardNumeric: 20,
    icon: InstagramIcon,
    instructions: "Like the latest post on Instagram.",
    proofRequired: "Screenshot showing red heart",
  },
  {
    id: "st_3",
    name: "Facebook Comment",
    platform: "Facebook",
    reward: "₦50",
    rewardNumeric: 50,
    icon: Facebook01Icon,
    instructions: "Leave a positive comment on Facebook.",
    proofRequired: "Screenshot of posted comment",
  },
  {
    id: "st_4",
    name: "YouTube Subscribe",
    platform: "YouTube",
    reward: "₦35",
    rewardNumeric: 35,
    icon: YoutubeIcon,
    instructions: "Subscribe to our YouTube channel.",
    proofRequired: "Screenshot showing Subscribed status",
  },
  {
    id: "st_5",
    name: "Website Signup",
    platform: "Website",
    reward: "₦120",
    rewardNumeric: 120,
    icon: GlobalSearchIcon,
    instructions: "Register a free account on the target website.",
    proofRequired: "Welcome dashboard screenshot",
  },
  {
    id: "st_6",
    name: "Telegram Join",
    platform: "Telegram",
    reward: "₦25",
    rewardNumeric: 25,
    icon: TelegramIcon,
    instructions: "Join the official Telegram broadcast channel.",
    proofRequired: "Screenshot of joined channel",
  },
  {
    id: "st_7",
    name: "WhatsApp Status Post",
    platform: "WhatsApp",
    reward: "₦40",
    rewardNumeric: 40,
    icon: WhatsappIcon,
    instructions: "Post campaign flyer to your WhatsApp status for 24h.",
    proofRequired: "Screenshot of WhatsApp status view count",
  },
  {
    id: "st_8",
    name: "LinkedIn Connect",
    platform: "LinkedIn",
    reward: "₦60",
    rewardNumeric: 60,
    icon: Linkedin01Icon,
    instructions: "Connect with the company page on LinkedIn.",
    proofRequired: "Screenshot showing 1st degree connection",
  },
];

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0A0A0A] border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto space-y-6">
        
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <SocialBrandIcon platform={task.platform} size={20} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white leading-tight">{task.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${access.badgeColorClass}`}>
                  {access.badgeText}
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-medium">{task.platform}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDone}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Step 1: Detail */}
        {step === "detail" && (
          <div className="space-y-6 flex-1">
            {/* Reward */}
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Reward
              </span>
              <span className="text-2xl font-black text-[#008744]">{task.reward}</span>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instructions</h4>
              <p className="text-xs text-zinc-300 bg-[#121212] p-4 rounded-xl border border-white/5">
                {task.instructions}
              </p>
            </div>

            {/* Proof Required */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Proof Required</h4>
              <p className="text-xs text-zinc-300 bg-[#121212] p-3.5 rounded-xl border border-white/5">
                {task.proofRequired}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Proof Upload */}
        {step === "proof" && (
          <form onSubmit={handleSubmitProof} className="space-y-6 flex-1">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Upload Proof</h4>
              <p className="text-xs text-zinc-400">{task.proofRequired}</p>
            </div>

            <div className="border-2 border-dashed border-white/10 hover:border-[#008744]/60 bg-[#121212] rounded-2xl p-6 text-center space-y-3 cursor-pointer">
              <HugeiconsIcon icon={Upload01Icon} size={28} className="text-[#008744] mx-auto" />
              <div>
                <label htmlFor="proof-file" className="text-xs font-bold text-white cursor-pointer hover:underline block">
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
            </div>

            <button
              type="submit"
              disabled={!file}
              className="w-full h-[46px] rounded-xl bg-[#008744] hover:bg-[#00753b] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Submit Proof</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </form>
        )}

        {/* Step 3: Submitted */}
        {step === "submitted" && (
          <div className="text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-[#008744]/20 border border-[#008744]/40 flex items-center justify-center text-[#008744] mx-auto">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Proof Submitted!</h3>
              <p className="text-xs text-zinc-400">
                Your submission is currently under review by the campaign manager.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDone}
              className="w-full h-[44px] rounded-xl bg-[#008744] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Done
            </button>
          </div>
        )}

        {/* Action Button */}
        {step === "detail" && (
          <button
            type="button"
            onClick={handleStart}
            className="w-full h-[46px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>Start Task</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
