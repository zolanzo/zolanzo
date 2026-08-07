"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useCapabilities, PlatformCapability } from "@/lib/capabilities-service";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  UserIcon,
  QrCodeIcon,
  Copy01Icon,
  Share01Icon,
  Download01Icon,
  CheckmarkCircle01Icon,
  Settings01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  InformationCircleIcon,
  Cancel01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";

export default function MobileProfilePage() {
  const { platforms, readinessPercentage, capabilities, connectPlatform } = useCapabilities();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEmployerViewModal, setShowEmployerViewModal] = useState(false);

  // Health and verification states
  const [healthPercentage] = useState(82);
  const [healthItems] = useState([
    { id: "email", label: "Email Verified", status: "completed", href: "/settings" },
    { id: "phone", label: "Phone Verified", status: "completed", href: "/settings" },
    { id: "bank", label: "Bank Connected", status: "completed", href: "/settings" },
    { id: "pin", label: "Payment PIN Set", status: "completed", href: "/settings" },
    { id: "nin", label: "NIN Identity Verification", status: "pending", href: "/settings" },
    { id: "social", label: "Social Accounts Linked", status: "pending", href: "#connected-accounts" },
  ]);

  // Modal and sheet states
  const [connectModalAccount, setConnectModalAccount] = useState<PlatformCapability | null>(null);
  const [connectUsername, setConnectUsername] = useState("");
  const [connectProfileUrl, setConnectProfileUrl] = useState("");
  const [connectScreenshot, setConnectScreenshot] = useState("");
  const [trustScoreOpen, setTrustScoreOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [editBankOpen, setEditBankOpen] = useState(false);

  const numAmount = Number(withdrawAmount) || 0;
  const isBelowMinimum = withdrawAmount.length > 0 && numAmount < 2000;

  const handleSocialConnectSubmit = () => {
    if (connectModalAccount && connectUsername) {
      connectPlatform(connectModalAccount.platform, connectUsername);
      setConnectModalAccount(null);
      setConnectUsername("");
      setConnectProfileUrl("");
      setConnectScreenshot("");
    }
  };

  const socialAccounts = Object.values(platforms);

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-4xl mx-auto space-y-5 px-4 sm:px-0 py-3 select-none pb-24">

        {/* PROFILE REPUTATION HEADER */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 shadow-xs shrink-0">
              <Image
                src="/brand/lady1.png"
                alt="Grace Okafor"
                width={60}
                height={60}
                className="w-15 h-15 rounded-[14px] object-cover bg-white"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base font-black text-slate-900 leading-tight">Grace Okafor</h1>
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-emerald-600 shrink-0" />
                <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Level 4 • Professional
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                <span>@grace_earner</span>
                <span>•</span>
                <span>Member since August 2026</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <button
              type="button"
              onClick={() => setShowEmployerViewModal(true)}
              className="h-8.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <HugeiconsIcon icon={UserIcon} size={14} />
              <span>Employer View 👁️</span>
            </button>
            <Link
              href="/settings"
              className="h-8.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <HugeiconsIcon icon={Settings01Icon} size={14} />
              <span>My Settings →</span>
            </Link>
          </div>
        </div>

        {/* 1. EARNING PASSPORT DIGITAL IDENTITY CARD */}
        <div id="earning-passport" className="relative p-[1.5px] rounded-[24px] bg-gradient-to-tr from-teal-500 via-emerald-500 to-amber-500 shadow-medium">
          <div className="bg-white rounded-[23px] p-4 sm:p-6 space-y-4">
            
            {/* CARD TOP HEADER */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative p-0.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xs shrink-0">
                  <Image
                    src="/brand/lady1.png"
                    alt="Grace Okafor"
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-[14px] object-cover bg-white"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-black">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-slate-900 leading-tight">Grace Okafor</h2>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Gold Tier
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 block mt-0.5">@grace_earner</span>
                  
                  {/* WORKER ID & COPY */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      ZOL-ER-00018492
                    </span>
                    <button
                      type="button"
                      onClick={() => alert("Worker ID copied to clipboard!")}
                      className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer transition-colors"
                      title="Copy Worker ID"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* TOP RIGHT LOGO & QR CODE BUTTON */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black tracking-tight text-emerald-800">ZOLANZO</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">PASSPORT</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors cursor-pointer group"
                >
                  <HugeiconsIcon icon={QrCodeIcon} size={28} className="text-slate-700 group-hover:scale-105 transition-transform" />
                </button>
              </div>
            </div>

            {/* TRUST & READINESS METRICS */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Trust Score</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">98%</span>
              </div>
              <div className="text-center border-x border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Readiness</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">{readinessPercentage}%</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Health</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">82%</span>
              </div>
            </div>

            {/* TASK STATISTICS (AUTOMATIC REPUTATION CALCULATION) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Task Statistics</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Completed Tasks</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">142</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Approval Rate</span>
                  <span className="text-xs font-black text-emerald-600 block mt-0.5">99.3%</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Current Streak</span>
                  <span className="text-xs font-black text-amber-600 block mt-0.5">14 Days 🔥</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Longest Streak</span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">28 Days</span>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTIONS ROW */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => alert("Downloading Earning Passport PDF...")}
                className="h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <HugeiconsIcon icon={Download01Icon} size={13} />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                type="button"
                onClick={() => alert("Sharing Passport link...")}
                className="h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <HugeiconsIcon icon={Share01Icon} size={13} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                type="button"
                onClick={() => alert("Worker ID copied!")}
                className="h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <HugeiconsIcon icon={Copy01Icon} size={13} />
                <span className="hidden sm:inline">Copy ID</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <HugeiconsIcon icon={QrCodeIcon} size={13} />
                <span>View QR</span>
              </button>
            </div>

          </div>
        </div>

        {/* 3. WORKER LEVEL PROGRESSION SYSTEM (AUTOMATIC XP & LEVEL ADVANCEMENT) */}
        <div id="worker-level" className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Level 4 • Professional
                </span>
                <span className="text-xs font-bold text-emerald-600">3,850 XP</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Complete tasks to earn XP, unlock higher levels, and gain exclusive benefits.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-slate-900">Next: Level 5 Elite</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">8 Tasks Remaining</span>
            </div>
          </div>

          {/* XP PROGRESS BAR */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>Current XP: 3,850 / 4,500</span>
              <span>85.5% to Level 5</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/40">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 rounded-full transition-all duration-700 shadow-xs"
                style={{ width: `85.5%` }}
              />
            </div>
          </div>

          {/* WORKER LEVELS SITEMAP / TRACK */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progression Roadmap</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
              {[
                { lvl: 1, name: "Starter", active: false, current: false },
                { lvl: 2, name: "Explorer", active: false, current: false },
                { lvl: 3, name: "Verified Earner", active: false, current: false },
                { lvl: 4, name: "Professional", active: true, current: true },
                { lvl: 5, name: "Elite Worker", active: false, current: false },
                { lvl: 6, name: "Master Worker", active: false, current: false },
                { lvl: 7, name: "Legend", active: false, current: false },
              ].map((l) => (
                <div
                  key={l.lvl}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    l.current
                      ? "bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs"
                      : l.lvl < 4
                      ? "bg-emerald-50/40 border-emerald-200/60 text-emerald-800 opacity-80"
                      : "bg-slate-50 border-slate-100 text-slate-400 opacity-60"
                  }`}
                >
                  <span className="text-[9px] font-black uppercase block">Lvl {l.lvl}</span>
                  <span className="text-[10px] font-bold truncate block mt-0.5">{l.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* UNLOCKED & UPCOMING BENEFITS */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Level Benefits</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-2">
                <span className="text-emerald-600 text-xs">✓</span>
                <span className="text-xs font-bold text-emerald-950">Higher paying campaigns</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-2">
                <span className="text-emerald-600 text-xs">✓</span>
                <span className="text-xs font-bold text-emerald-950">Priority moderation</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-2">
                <span className="text-emerald-600 text-xs">✓</span>
                <span className="text-xs font-bold text-emerald-950">Exclusive jobs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center gap-2">
                <span className="text-amber-600 text-xs">🔒</span>
                <span className="text-xs font-bold text-amber-950">Employer invitations (Lvl 5)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center gap-2">
                <span className="text-amber-600 text-xs">🔒</span>
                <span className="text-xs font-bold text-amber-950">Better referral rewards (Lvl 5)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2 opacity-70">
                <span className="text-slate-400 text-xs">🔒</span>
                <span className="text-xs font-bold text-slate-700">Future beta access (Lvl 6)</span>
              </div>
            </div>
          </div>
        </div>
        {/* SECTION 3: ACCOUNT HEALTH */}
        <div id="account-health" className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Health</h2>
            <span className="text-xs font-black text-emerald-600">{healthPercentage}% Complete</span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${healthPercentage}%` }}
            />
          </div>

          {/* STATUS ROWS: GREEN CHECKMARKS FOR COMPLETED, RED/AMBER FOR INCOMPLETE */}
          <div className="space-y-2 pt-0.5">
            {healthItems.map((item) => {
              const isDone = item.status === "completed";
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDone
                      ? "bg-emerald-50/40 border-emerald-100/80"
                      : "bg-slate-50/80 border-slate-200/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[11px] font-black shrink-0 border border-emerald-200">
                        ✓
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[11px] font-black shrink-0 border border-red-200">
                        !
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                  </div>

                  {!isDone ? (
                    <Link
                      href={item.href}
                      className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
                    >
                      Connect
                    </Link>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                      ✓ Done
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 9: FINANCIAL PROFILE (PREMIUM BANKING CARDS) */}
        <div id="financial-profile" className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Financial Profile</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time breakdown of balances, historical earnings, and withdrawal metrics.
              </p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full shrink-0">
              Payouts Ready ⚡
            </span>
          </div>

          {/* FINANCIAL STATS GRID (PREMIUM BANKING CARDS) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Available Balance</span>
              <span className="text-base font-black text-emerald-600 block mt-0.5">₦12,350.00</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending Review</span>
              <span className="text-base font-black text-amber-600 block mt-0.5">₦1,250.00</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Lifetime Earnings</span>
              <span className="text-base font-black text-slate-900 block mt-0.5">₦148,500.00</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">This Month</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">₦42,800</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">This Week</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">₦12,400</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Today</span>
              <span className="text-sm font-black text-emerald-600 block mt-0.5">₦3,200</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Largest Withdrawal</span>
              <span className="text-sm font-black text-emerald-600 block mt-0.5">₦25,000</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Withdrawn</span>
              <span className="text-sm font-black text-slate-900 block mt-0.5">₦144,000</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Weekly Earnings</span>
              <span className="text-sm font-black text-emerald-600 block mt-0.5">₦14,850</span>
            </div>
          </div>
        </div>

        {/* 3. DEDICATED FIRST-CLASS "CONNECTED ACCOUNTS" SECTION (IMMEDIATELY BELOW ACCOUNT HEALTH) */}
        <div id="connected-accounts" className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-900 tracking-wider uppercase">Connected Accounts</h2>
            <span className="text-[11px] font-semibold text-slate-400">10 Platforms</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-[20px] divide-y divide-slate-100 overflow-hidden shadow-soft">
            {socialAccounts.map((soc) => {
              let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
              let btnColor = "bg-emerald-600 hover:bg-emerald-700 text-white";

              if (soc.status === "ready") {
                badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200/60";
                btnColor = "bg-slate-100 hover:bg-slate-200 text-slate-700";
              } else if (soc.status === "pending") {
                badgeColor = "bg-amber-50 text-amber-700 border-amber-200/60";
                btnColor = "bg-amber-500 hover:bg-amber-600 text-white";
              } else if (soc.status === "unavailable") {
                badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                btnColor = "bg-emerald-600 hover:bg-emerald-700 text-white";
              }

              const displayHandle = soc.handle || "Not Connected";

              return (
                <div
                  key={soc.name}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <SocialBrandIcon platform={soc.platform} size={20} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900 truncate">{soc.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
                          {soc.statusText}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium truncate block mt-0.5">
                        {displayHandle}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setConnectModalAccount(soc);
                      setConnectUsername(displayHandle.startsWith("@") ? displayHandle : "");
                    }}
                    className={`h-8 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-[0.98] ${btnColor}`}
                  >
                    {soc.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. BRAND NEW "YOUR CAPABILITIES & OPPORTUNITY UNLOCK" SECTION (IMMEDIATELY BELOW CONNECTED ACCOUNTS) */}
        <div id="your-capabilities" className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Your Capabilities</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time breakdown of active capabilities vs. locked opportunities.
              </p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full shrink-0">
              Active Access
            </span>
          </div>

          {/* CAPABILITIES CATEGORIES GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {capabilities.map((cap) => {
              let style = "bg-emerald-50/60 border-emerald-200/60 text-emerald-900";
              let badgeStyle = "bg-emerald-600 text-white";
              let statusLabel = "Ready";

              if (cap.status === "pending") {
                style = "bg-amber-50/60 border-amber-200/60 text-amber-900";
                badgeStyle = "bg-amber-500 text-white";
                statusLabel = "Pending Verification";
              } else if (cap.status === "unavailable") {
                style = "bg-red-50/50 border-red-200/60 text-red-900";
                badgeStyle = "bg-red-600 text-white";
                statusLabel = "Not Connected";
              }

              return (
                <div
                  key={cap.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${style}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${badgeStyle}`}>
                      {cap.symbol}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold truncate">{cap.label}</h3>
                      <span className="text-[10px] font-extrabold opacity-90 block truncate">{statusLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NEXT UNLOCKS (OPPORTUNITY UNLOCK SYSTEM) */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Next Unlocks</span>
              <span className="text-[11px] font-bold text-emerald-600">4 Actions Available</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Connect Telegram</h4>
                  <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">Unlock 43 new tasks</span>
                </div>
                <Link
                  href="/profile#connected-accounts"
                  className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  Connect
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Verify LinkedIn</h4>
                  <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">Unlock 26 professional tasks</span>
                </div>
                <Link
                  href="/profile#connected-accounts"
                  className="h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  Verify
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Verify Phone</h4>
                  <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">Increase Trust Score to 100%</span>
                </div>
                <Link
                  href="/settings"
                  className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer"
                >
                  Verify
                </Link>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Complete Profile</h4>
                  <span className="text-[11px] font-bold text-emerald-600 block mt-0.5">Unlock Instant Withdrawals</span>
                </div>
                <Link
                  href="/settings"
                  className="h-7 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer"
                >
                  Complete
                </Link>
              </div>
            </div>
          </div>

          {/* BOTTOM SUMMARY: OPPORTUNITY READINESS */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Opportunity Readiness</span>
              <span className="text-sm font-black text-emerald-600">{readinessPercentage}%</span>
            </div>

            {/* Animated Readiness Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full transition-all duration-700"
                style={{ width: `${readinessPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5. SIGNATURE "ACCOUNT REPUTATION" FINTECH CREDIT DASHBOARD */}
        <div id="account-reputation" className="bg-white border border-slate-200/80 rounded-[20px] p-4 sm:p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account Reputation</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Your digital identity & earning credit score on Zolanzo.
              </p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full shrink-0">
              Tier 1 Platinum
            </span>
          </div>

          {/* REPUTATION ANALYTICS CARDS (GRID LAYOUT) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trust Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-emerald-600">98%</span>
                <span className="text-[10px] font-bold text-emerald-700">Perfect</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completion Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-slate-900">99.2%</span>
                <span className="text-[10px] font-bold text-slate-500">142/143</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Completed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-slate-900">142</span>
                <span className="text-[10px] font-bold text-emerald-600">Tasks</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Success Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-emerald-600">99.3%</span>
                <span className="text-[10px] font-bold text-emerald-700">Top 5%</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejections</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-slate-900">1</span>
                <span className="text-[10px] font-bold text-slate-400">Total</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disputes</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-slate-900">0</span>
                <span className="text-[10px] font-bold text-emerald-600">Clean Record</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Member Since</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-extrabold text-slate-900">Jan 2024</span>
                <span className="text-[10px] font-bold text-slate-400">2 yrs</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Referral Rank</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-amber-600">Top 10</span>
                <span className="text-[10px] font-bold text-amber-700">Gold</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Level</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-extrabold text-emerald-600">Level 3</span>
                <span className="text-[10px] font-bold text-emerald-700">Verified</span>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Readiness</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-black text-emerald-600">{readinessPercentage}%</span>
                <span className="text-[10px] font-bold text-emerald-700">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* WITHDRAW EARNINGS ACTION BAR */}
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 shadow-soft flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={ArrowUp01Icon} size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Withdraw Earnings</h3>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Instant payout to your linked bank account</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98] shrink-0"
          >
            Withdraw
          </button>
        </div>

        {/* QUICK LINK TO ACCOUNT CENTER / MY SETTINGS */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-[20px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Manage Account & Settings</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Edit personal details, bank info, security PIN, notifications, and connected accounts.
            </p>
          </div>
          <Link
            href="/settings"
            className="h-9 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Account Center</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </div>

      </div>

      {/* --- MODALS & BOTTOM SHEETS --- */}

      {/* SOCIAL CONNECT BOTTOM SHEET */}
      {connectModalAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[28px] sm:rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-floating animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <SocialBrandIcon platform={connectModalAccount.platform} size={20} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Connect {connectModalAccount.name}</h3>
                  <span className="text-[11px] text-slate-400 font-medium block">Estimated review time: 1-2 hours</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalAccount(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {connectModalAccount.name} Username / Handle
                </label>
                <input
                  type="text"
                  value={connectUsername}
                  onChange={(e) => setConnectUsername(e.target.value)}
                  placeholder="@your_username"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Profile URL
                </label>
                <input
                  type="url"
                  value={connectProfileUrl}
                  onChange={(e) => setConnectProfileUrl(e.target.value)}
                  placeholder={`https://${connectModalAccount.platform.toLowerCase()}.com/your_username`}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Profile Screenshot Proof
                </label>
                <div
                  onClick={() => setConnectScreenshot("/brand/lady1.png")}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50"
                >
                  {connectScreenshot ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} />
                      <span>Screenshot uploaded (profile_proof.png)</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1 text-slate-500">
                      <HugeiconsIcon icon={Upload01Icon} size={20} className="text-slate-400" />
                      <span className="font-semibold">Click to upload screenshot</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConnectModalAccount(null)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!connectUsername}
                onClick={handleSocialConnectSubmit}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Submit Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRUST SCORE MODAL */}
      {trustScoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-floating animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <HugeiconsIcon icon={InformationCircleIcon} size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">How Trust Score Works</h3>
              </div>
              <button
                type="button"
                onClick={() => setTrustScoreOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your <strong>Trust Score (98%)</strong> is calculated dynamically based on real-time platform metrics:
            </p>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-emerald-700 block mb-0.5">✓ Task Completion Rate</strong>
                High ratio of successfully submitted tasks without cancellations.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-emerald-700 block mb-0.5">✓ Successful Hirer Reviews</strong>
                Positive feedback and proof validation from campaign owners.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-emerald-700 block mb-0.5">✓ Zero Dispute History</strong>
                Clean record with no rejected proofs or fraudulent submissions.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <strong className="text-emerald-700 block mb-0.5">✓ Verified Identity & Bank</strong>
                Active NIN verification and linked Nigerian bank account.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTrustScoreOpen(false)}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* WITHDRAWAL MODAL WITH INLINE MINIMUM VALIDATION */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-floating animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Request Withdrawal</h3>
              <button
                type="button"
                onClick={() => {
                  setWithdrawModalOpen(false);
                  setWithdrawAmount("");
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Destination Bank
                </label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-900 flex justify-between items-center">
                  <span>Kuda Bank (Grace Okafor)</span>
                  <span className="text-slate-400 font-normal">****8921</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 2500)"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />

                {/* INLINE VALIDATION FOR MINIMUM THRESHOLD (NO POPUPS) */}
                {isBelowMinimum && (
                  <p className="text-xs font-bold text-amber-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Minimum withdrawal amount is ₦2,000.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBelowMinimum || numAmount === 0}
                onClick={() => {
                  alert(`Withdrawal request of ₦${withdrawAmount} submitted successfully!`);
                  setWithdrawModalOpen(false);
                  setWithdrawAmount("");
                }}
                className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BANK MODAL */}
      {editBankOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-5 space-y-4 shadow-floating animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Bank Account Details</h3>
              <button
                type="button"
                onClick={() => setEditBankOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 text-xs text-emerald-800 space-y-1">
              <strong className="block">Bank Account Status: Verified ✓</strong>
              <p>Account name match verified against official NIN records (Grace Okafor).</p>
            </div>

            <button
              type="button"
              onClick={() => setEditBankOpen(false)}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* VIEW PASSPORT QR MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-5 space-y-4 shadow-floating animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Digital Worker Passport QR</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                <HugeiconsIcon icon={QrCodeIcon} size={140} className="text-slate-900" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 block mt-2">
                ZOL-ER-00018492
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Gold Tier • Grace Okafor
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EMPLOYER VIEW MODAL (PROFESSIONAL METRICS EXPOSED, SENSITIVE INFORMATION HIDDEN) */}
      {showEmployerViewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-floating animate-in fade-in zoom-in-95 duration-200">
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Employer Preview Mode 👁️
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Worker Profile: Grace Okafor</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEmployerViewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            {/* VERIFIED WORKER BADGE & BACKGROUND CHECKS */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} className="text-emerald-600" />
                <h4 className="text-sm font-black text-emerald-950">Verified Worker • High Confidence</h4>
              </div>
              <p className="text-xs text-emerald-900/80 font-medium">
                Verified background checks on record. Employers receive guaranteed delivery protection on assignments.
              </p>

              {/* BACKGROUND CHECKS GRID */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="text-xs font-bold text-emerald-900 bg-white/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Phone Verified
                </div>
                <div className="text-xs font-bold text-emerald-900 bg-white/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Email Verified
                </div>
                <div className="text-xs font-bold text-emerald-900 bg-white/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Bank Account Verified
                </div>
                <div className="text-xs font-bold text-emerald-900 bg-white/80 border border-emerald-200/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Social Accounts Verified
                </div>
              </div>
            </div>

            {/* KEY PROFESSIONAL METRICS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Trust Score</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">98% Perfect</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Response Time</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">4 Mins ⚡</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Approval Rate</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">99.3%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Completion Rate</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">99.2%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Member Since</span>
                <span className="text-xs font-black text-slate-800 block mt-1">Jan 2024</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Worker Level</span>
                <span className="text-xs font-black text-amber-700 block mt-1">Lvl 4 Professional</span>
              </div>
            </div>

            {/* TOP SKILLS & CAPABILITIES */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verified Skills & Expertise</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Social Media Marketing",
                  "App Store Reviews",
                  "Data Entry",
                  "User Testing",
                  "Survey Completion",
                  "Content Moderation",
                  "Instagram Creator",
                  "TikTok Engagement",
                ].map((skill) => (
                  <span key={skill} className="text-[11px] font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    ✨ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* PRIVACY NOTICE */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 block">🔒 Privacy Standard</span>
              <p>Personal financial history, bank account details, and full NIN numbers are protected and never exposed to employers.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowEmployerViewModal(false)}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Close Employer Preview
            </button>
          </div>
        </div>
      )}

    </AppShell>
  );
}
