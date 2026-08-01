"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

// Global App Shell
import { AppShell } from "@/components/shell/app-shell";

// Worker Components
import { WalletCard } from "@/components/worker/wallet-card";
import { QuickActions } from "@/components/worker/quick-actions";
import { TaskPreviewCard, type TaskItem } from "@/components/worker/task-preview-card";
import { ProgressCard } from "@/components/worker/progress-card";
import { ActivityFeed } from "@/components/worker/activity-feed";
import { AchievementCard } from "@/components/worker/achievement-card";
import { TipsCard } from "@/components/worker/tips-card";
import { SkeletonLoader } from "@/components/worker/skeleton-loader";
import { WelcomeModal } from "@/components/auth/welcome-modal";
import { PhoneGateModal } from "@/components/auth/phone-gate-modal";
import { usePhoneGate } from "@/hooks/use-phone-gate";

export default function EarnerDashboardPage() {
  const [loading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(70);
  const { isOpen, actionName, triggerGate, handleVerified, handleClose } = usePhoneGate();

  // Mock Recommended Tasks
  const recommendedTasks: TaskItem[] = [
    {
      id: "task_1",
      title: "AI Model Image Annotation",
      category: "AI Project",
      reward: "₦850",
      estimatedTime: "18 mins",
      activeWorkers: 23,
      badge: "High Pay",
    },
    {
      id: "task_2",
      title: "Instagram Brand Campaign Engagement",
      category: "Social Media",
      reward: "₦350",
      estimatedTime: "5 mins",
      activeWorkers: 147,
      badge: "Quick Task",
    },
    {
      id: "task_3",
      title: "Customer Support Live Chat Assistance",
      category: "Virtual Assistant",
      reward: "₦5,000",
      estimatedTime: "2 hrs",
      activeWorkers: 8,
      badge: "Featured",
    },
  ];

  const handleApplyTask = (task: TaskItem) => {
    triggerGate(`Apply for "${task.title}"`, () => {
      alert(`Successfully applied for task: ${task.title}. Reward: ${task.reward}`);
    });
  };

  const handleWithdraw = () => {
    triggerGate("Withdraw Funds to Bank Account", () => {
      alert("Redirecting to withdrawal request flow...");
    });
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      {/* Welcome Experience Modal */}
      <WelcomeModal role="worker" />

      {/* Phone Verification Security Gate Modal */}
      <PhoneGateModal
        isOpen={isOpen}
        actionName={actionName}
        onVerified={handleVerified}
        onClose={handleClose}
      />

      {loading ? (
        <SkeletonLoader />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[68%_32%] gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN (~70%) */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* SECTION 1: WALLET SUMMARY */}
            <WalletCard
              availableBalance="₦283,600"
              todayEarnings="₦18,400"
              pendingEarnings="₦7,250"
              onWithdraw={handleWithdraw}
              onHistory={() => alert("Viewing transaction history...")}
            />

            {/* SECTION 2: PROFILE COMPLETION (Hidden when 100%) */}
            {profileCompletion < 100 && (
              <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">Complete your profile</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${profileCompletion}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-zinc-400 font-semibold">{profileCompletion}% Complete</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/onboarding"
                  onClick={() => setProfileCompletion(100)}
                  className="h-[38px] px-4 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  <span>Complete Profile</span>
                </Link>
              </div>
            )}

            {/* SECTION 3: QUICK ACTIONS */}
            <QuickActions />

            {/* SECTION 4: RECOMMENDED TASKS */}
            <div className="space-y-3" id="recommended-tasks">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Recommended Tasks
                </h3>
                <span className="text-xs font-semibold text-emerald-400">3 Matches</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedTasks.map((task) => (
                  <TaskPreviewCard
                    key={task.id}
                    task={task}
                    onApply={handleApplyTask}
                  />
                ))}
              </div>

              <div className="pt-2 flex justify-center">
                <Link
                  href="#recommended-tasks"
                  className="h-[42px] px-6 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-200 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <span>Browse All Tasks →</span>
                </Link>
              </div>
            </div>

            {/* SECTION 5: DAILY PROGRESS */}
            <ProgressCard goalAmount="₦25,000" earnedAmount="₦18,400" percentage={74} />

          </div>

          {/* RIGHT COLUMN (~30%) */}
          <div className="space-y-6">
            
            {/* WIDGET 1: RECENT ACTIVITY */}
            <ActivityFeed />

            {/* WIDGET 2: ACHIEVEMENTS */}
            <AchievementCard />

            {/* WIDGET 3: PRO TIPS */}
            <TipsCard />

            {/* FOOTER ACCENT */}
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 text-center text-xs text-zinc-500 space-y-1">
              <p className="font-semibold text-zinc-400">ZOLANZO Earner Protection</p>
              <p className="text-[11px] text-zinc-500">All task payouts are guaranteed by bank-grade escrow funds.</p>
            </div>

          </div>

        </div>
      )}
    </AppShell>
  );
}
