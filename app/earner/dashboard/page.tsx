"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TiktokIcon,
  InstagramIcon,
  Facebook01Icon,
  YoutubeIcon,
  GlobalSearchIcon,
  TelegramIcon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  Notification01Icon,
  Task01Icon,
  UserGroupIcon,
  FireIcon,
} from "@hugeicons/core-free-icons";

import { AppShell } from "@/components/shell/app-shell";
import { PhoneGateModal } from "@/components/auth/phone-gate-modal";
import { usePhoneGate } from "@/hooks/use-phone-gate";
import { TaskDrawer, type SimpleTaskItem } from "@/components/marketplace/simple-task-drawer";
import { ConnectAccountSheet } from "@/components/marketplace/connect-account-sheet";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useCapabilities } from "@/lib/capabilities-service";

export default function EarnerHomePage() {
  const { getTaskAccess } = useCapabilities();
  const { isOpen, actionName, triggerGate, handleVerified, handleClose } = usePhoneGate();
  const [activeTask, setActiveTask] = useState<SimpleTaskItem | null>(null);
  const [connectSheetTarget, setConnectSheetTarget] = useState<SimpleTaskItem | null>(null);

  // Tasks List
  const tasks: SimpleTaskItem[] = [
    {
      id: "st_1",
      name: "TikTok Follow",
      platform: "TikTok",
      reward: "₦30",
      rewardNumeric: 30,
      icon: TiktokIcon,
      instructions: "Follow @zolanzo_app on TikTok.",
      proofRequired: "Screenshot showing Following status",
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
  ];

  const handleTaskAction = (task: SimpleTaskItem) => {
    const access = getTaskAccess(task.platform);
    if (access.isAccessible) {
      triggerGate(`Start "${task.name}"`, () => setActiveTask(task));
    } else if (access.status === "unavailable" || access.status === "rejected") {
      setConnectSheetTarget(task);
    }
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      {/* Security Gate Modal */}
      <PhoneGateModal
        isOpen={isOpen}
        actionName={actionName}
        onVerified={handleVerified}
        onClose={handleClose}
      />

      {/* Task Execution Drawer */}
      <TaskDrawer
        task={activeTask}
        isOpen={Boolean(activeTask)}
        onClose={() => setActiveTask(null)}
      />

      {/* IN-FLOW CONNECT ACCOUNT SHEET */}
      {connectSheetTarget && (
        <ConnectAccountSheet
          platform={connectSheetTarget.platform}
          readiness={getTaskAccess(connectSheetTarget.platform)}
          isOpen={Boolean(connectSheetTarget)}
          onClose={() => setConnectSheetTarget(null)}
          onSuccess={() => {
            const target = connectSheetTarget;
            setConnectSheetTarget(null);
            triggerGate(`Start "${target.name}"`, () => setActiveTask(target));
          }}
        />
      )}

      {/* DASHBOARD CONTAINER - FOCUSED STRICTLY ON MAKING MONEY */}
      <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-0 py-3">

        {/* 1. GREETING & EARNING HERO HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-[24px] p-5 sm:p-6 shadow-medium space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-200/90 uppercase tracking-wider block">
                Good Morning 👋
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white leading-tight mt-0.5">
                Grace Okafor
              </h1>
            </div>
            <Link
              href="/notifications"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors relative cursor-pointer"
            >
              <HugeiconsIcon icon={Notification01Icon} size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </Link>
          </div>

          {/* TODAY'S EARNINGS & AVAILABLE BALANCE */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/15">
            <div>
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
                Today&apos;s Earnings
              </span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 block mt-0.5">
                ₦3,200.00
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
                Available Balance
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
                ₦12,350.00
              </span>
            </div>
          </div>
        </div>

        {/* 2. QUICK STATS (DAILY PERFORMANCE METRICS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-3.5 shadow-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tasks Today
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">8 Completed</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[20px] p-3.5 shadow-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Approval Rate
            </span>
            <span className="text-base font-black text-emerald-600 mt-0.5 block">99.3%</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[20px] p-3.5 shadow-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Streak
            </span>
            <span className="text-base font-black text-amber-600 mt-0.5 block">14 Days 🔥</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[20px] p-3.5 shadow-soft">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Review
            </span>
            <span className="text-base font-black text-slate-900 mt-0.5 block">₦1,250.00</span>
          </div>
        </div>

        {/* 3. DAILY CHALLENGE INCENTIVE BANNER */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-[20px] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HugeiconsIcon icon={FireIcon} size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-amber-950">Daily Earning Challenge</h3>
                <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  +₦500 Bonus
                </span>
              </div>
              <p className="text-xs text-amber-900 font-medium mt-0.5">
                Complete 10 tasks today to unlock your daily streak bonus! (8/10 done)
              </p>
            </div>
          </div>
          <Link
            href="/tasks"
            className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center cursor-pointer"
          >
            Complete 2 More
          </Link>
        </div>

        {/* 4. CAMPAIGN ALERTS (HIGH PAYING HOT JOBS) */}
        <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-[20px] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HugeiconsIcon icon={Task01Icon} size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black text-emerald-950 truncate">🔥 High Paying Campaign Alert</h3>
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ₦120 / task
                </span>
              </div>
              <p className="text-xs text-emerald-900 font-medium mt-0.5 truncate">
                Website Signups & App Downloads available now. 42 slots remaining!
              </p>
            </div>
          </div>
          <Link
            href="/tasks"
            className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center cursor-pointer"
          >
            Claim Job
          </Link>
        </div>

        {/* 5. LIVE TASKS (HIGH-CONVERSION TASK FEED) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              Live Tasks Available Now
            </h2>
            <Link href="/tasks" className="text-xs text-emerald-600 hover:underline font-bold">
              View All Tasks →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tasks.map((t) => {
              const readiness = getTaskAccess(t.platform);
              return (
                <div
                  key={t.id}
                  onClick={() => handleTaskAction(t)}
                  className="bg-white border border-slate-200/80 hover:border-emerald-500/40 rounded-[20px] p-4 h-[104px] flex items-center justify-between transition-all duration-200 shadow-soft hover:shadow-medium cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <SocialBrandIcon platform={t.platform} size={20} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">{t.name}</h3>
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} className="text-emerald-600 shrink-0" />
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${readiness.badgeColorClass}`}>
                          {readiness.badgeText}
                        </span>
                      </div>

                      <span className="text-xs font-black text-amber-600 block mt-0.5">
                        {t.reward}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskAction(t);
                    }}
                    className={`h-[36px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${readiness.buttonColorClass}`}
                  >
                    {readiness.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. RECOMMENDED TASKS & LEADERBOARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

          {/* LEADERBOARD CARD */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={18} className="text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Top Earners Today
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">Weekly Pool: ₦50,000</span>
            </div>

            <div className="space-y-2">
              {[
                { rank: 1, name: "Chidi O.", earned: "₦14,250", tasks: 48, avatar: "👑" },
                { rank: 2, name: "Grace Okafor (You)", earned: "₦12,350", tasks: 42, avatar: "🥈" },
                { rank: 3, name: "Amina B.", earned: "₦10,800", tasks: 36, avatar: "🥉" },
              ].map((row) => (
                <div
                  key={row.rank}
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs border ${
                    row.rank === 2
                      ? "bg-amber-50/80 border-amber-200/80 font-bold"
                      : "bg-slate-50/60 border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{row.avatar}</span>
                    <span className="font-bold text-slate-900">{row.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-amber-600 block">{row.earned}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">{row.tasks} Tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REFERRAL PROGRESS INCENTIVE */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} className="text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Referral Earning Progress
                  </h3>
                </div>
                <span className="text-xs font-black text-amber-600">Top 10 Gold</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Earn 10% lifetime commission on every task completed by your direct invites.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Invites</span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">12 Active</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Referral Bonus</span>
                  <span className="text-sm font-black text-emerald-600 block mt-0.5">₦14,800</span>
                </div>
              </div>
            </div>

            <Link
              href="/referrals"
              className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Share Referral Link & Earn</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
