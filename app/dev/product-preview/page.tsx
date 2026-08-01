"use client";

import React, { useState } from "react";
import { Icons, CategoryIconsRegistry } from "@/lib/icon-registry";
import { ICON_SIZES, ICON_STROKE_WIDTH } from "@/lib/icons";
import { BrandIcon, BrandType } from "@/components/ui/brand-icons";

type ScreenTab =
  | "landing"
  | "worker_dashboard"
  | "job_feed"
  | "job_details"
  | "wallet"
  | "profile"
  | "org_dashboard"
  | "settings"
  | "empty_state"
  | "error_state";

type ViewportMode = "desktop" | "mobile";

export default function ProductPreviewPage() {
  const [isDark, setIsDark] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [activeTab, setActiveTab] = useState<ScreenTab>("landing");

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <div className={isDark ? "dark bg-zinc-950 text-zinc-100 min-h-screen" : "bg-zinc-50 text-zinc-900 min-h-screen"}>
      
      {/* Top Prototype Control Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
              Z
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">ZOLANZO Real Product Test</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                  /dev/product-preview
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Stress-testing icons & BrandIcon components in authentic product contexts
              </p>
            </div>
          </div>

          {/* Viewport & Theme Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Viewport Mode Switcher */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium">
              <button
                onClick={() => setViewport("desktop")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewport === "desktop"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icons.dashboard size={14} /> Desktop (1200px)
              </button>
              <button
                onClick={() => setViewport("mobile")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewport === "mobile"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icons.phone size={14} /> Mobile (375px)
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              title="Toggle Light / Dark Theme"
            >
              {isDark ? <Icons.sparkles size={18} /> : <Icons.clock size={18} />}
            </button>

          </div>
        </div>

        {/* Screen Selection Tabs */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-1 py-2 text-xs font-medium">
            {[
              { id: "landing", label: "Landing Page", icon: Icons.home },
              { id: "worker_dashboard", label: "Worker Dashboard", icon: Icons.dashboard },
              { id: "job_feed", label: "Job Feed", icon: Icons.jobs },
              { id: "job_details", label: "Job Details", icon: Icons.file },
              { id: "wallet", label: "Wallet & Escrow", icon: Icons.wallet },
              { id: "profile", label: "Worker Profile", icon: Icons.profile },
              { id: "org_dashboard", label: "Org Dashboard", icon: Icons.organization },
              { id: "settings", label: "Settings", icon: Icons.settings },
              { id: "empty_state", label: "Empty State", icon: Icons.folder },
              { id: "error_state", label: "Error State", icon: Icons.refresh },
            ].map(({ id, label, icon: IconComponent }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as ScreenTab)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === id
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <IconComponent size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container Viewport Boundary */}
      <main className="py-8 px-4 flex justify-center">
        <div
          className={`w-full transition-all duration-300 ${
            viewport === "mobile"
              ? "max-w-[390px] border-[8px] border-zinc-800 dark:border-zinc-700 rounded-[40px] shadow-2xl overflow-hidden bg-white dark:bg-zinc-900 min-h-[780px]"
              : "max-w-6xl"
          }`}
        >
          
          {/* Mock Navigation Header */}
          <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                Z
              </div>
              <span className="font-extrabold tracking-tight text-base">ZOLANZO</span>
            </div>

            {viewport === "desktop" && (
              <nav className="flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 cursor-pointer">
                  <Icons.home size={ICON_SIZES.navigation} strokeWidth={ICON_STROKE_WIDTH} /> Home
                </span>
                <span className="hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer">
                  <Icons.explore size={ICON_SIZES.navigation} strokeWidth={ICON_STROKE_WIDTH} /> Explore
                </span>
                <span className="hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer">
                  <Icons.jobs size={ICON_SIZES.navigation} strokeWidth={ICON_STROKE_WIDTH} /> Jobs
                </span>
                <span className="hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer">
                  <Icons.messages size={ICON_SIZES.navigation} strokeWidth={ICON_STROKE_WIDTH} /> Messages
                </span>
                <span className="hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer">
                  <Icons.wallet size={ICON_SIZES.navigation} strokeWidth={ICON_STROKE_WIDTH} /> Wallet
                </span>
              </nav>
            )}

            <div className="flex items-center gap-3">
              <button className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <Icons.bell size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 font-bold flex items-center justify-center text-xs">
                KM
              </div>
            </div>
          </div>

          {/* SCREEN CONTENT SWITCHER */}
          <div className="p-6">
            
            {/* 1. LANDING PAGE */}
            {activeTab === "landing" && (
              <div className="space-y-10">
                {/* Hero Section */}
                <div className="text-center max-w-2xl mx-auto space-y-4 py-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Icons.verified size={14} /> Official African Workforce Marketplace
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                    Earn Money Completing Verified Digital & Field Tasks
                  </h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Join over 150,000 workers across Africa performing social media, AI data training, transcription, and field operations.
                  </p>

                  {/* Social Auth Logins using BrandIcon */}
                  <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                    <button className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 flex items-center gap-2.5 text-xs font-semibold shadow-xs min-h-[44px]">
                      <BrandIcon brand="google" size={20} /> Continue with Google
                    </button>
                    <button className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 flex items-center gap-2.5 text-xs font-semibold shadow-xs min-h-[44px]">
                      <BrandIcon brand="facebook" size={20} /> Continue with Facebook
                    </button>
                    <button className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 flex items-center gap-2.5 text-xs font-semibold shadow-xs min-h-[44px]">
                      <BrandIcon brand="apple" size={20} /> Continue with Apple
                    </button>
                  </div>
                </div>

                {/* Popular Job Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-tight">Featured Task Categories</h2>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer">
                      View all 37 <Icons.forward size={14} />
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: "Social Media", icon: Icons.share, count: "1,240 Tasks" },
                      { name: "AI Training", icon: CategoryIconsRegistry["AI Training"], count: "850 Tasks" },
                      { name: "Content Creation", icon: CategoryIconsRegistry["Content Creation"], count: "620 Tasks" },
                      { name: "Data Entry", icon: CategoryIconsRegistry["Data Entry"], count: "940 Tasks" },
                    ].map(({ name, icon: IconComp, count }) => (
                      <div key={name} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3 shadow-xs">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <IconComp size={20} strokeWidth={2} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{name}</div>
                          <div className="text-[10px] text-zinc-400">{count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Brand Tasks */}
                <div className="space-y-4">
                  <h2 className="text-lg font-bold tracking-tight">Trending Brand Micro-Tasks</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { brand: "instagram" as BrandType, title: "Instagram Content Moderation", reward: "$4.50 / task", time: "15 mins" },
                      { brand: "tiktok" as BrandType, title: "TikTok Video Tagging & Captions", reward: "$6.00 / task", time: "20 mins" },
                      { brand: "youtube" as BrandType, title: "YouTube Video Audio Transcription", reward: "$8.20 / task", time: "30 mins" },
                    ].map(({ brand, title, reward, time }) => (
                      <div key={title} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <BrandIcon brand={brand} size={40} background="glass" />
                          <span className="px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full">
                            {reward}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{title}</h3>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                            <span className="flex items-center gap-1"><Icons.clock size={12} /> {time}</span>
                            <span className="flex items-center gap-1"><Icons.escrow size={12} /> Escrow Guaranteed</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. WORKER DASHBOARD */}
            {activeTab === "worker_dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Welcome back, Kwame 👋</h2>
                    <p className="text-xs text-zinc-500">Verified Micro-Worker • Ghana</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                    <Icons.verified size={16} /> Level 3 Verified
                  </span>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Earnings", val: "$342.50", icon: Icons.coins, color: "text-emerald-600" },
                    { label: "Active Tasks", val: "3 Tasks", icon: Icons.jobs, color: "text-blue-600" },
                    { label: "Completed Tasks", val: "48 Done", icon: Icons.badge, color: "text-purple-600" },
                    { label: "Trust Score", val: "98.5%", icon: Icons.shieldCheck, color: "text-amber-600" },
                  ].map(({ label, val, icon: IconComp, color }) => (
                    <div key={label} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-500 font-medium">{label}</span>
                        <IconComp size={18} className={color} />
                      </div>
                      <div className="text-lg font-extrabold">{val}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Recent Task Approvals</h3>
                    <Icons.refresh size={16} className="text-zinc-400 cursor-pointer" />
                  </div>
                  <div className="space-y-3">
                    {[
                      { task: "AI Image Dataset Tagging", brand: "google" as BrandType, amt: "+$5.00", status: "Approved" },
                      { task: "WhatsApp Support Survey", brand: "whatsapp" as BrandType, amt: "+$3.20", status: "Approved" },
                      { task: "LinkedIn Market Research", brand: "linkedin" as BrandType, amt: "+$12.00", status: "In Review" },
                    ].map(({ task, brand, amt, status }) => (
                      <div key={task} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-3">
                          <BrandIcon brand={brand} size={32} background="soft" />
                          <div>
                            <div className="text-xs font-bold">{task}</div>
                            <div className="text-[10px] text-zinc-400">{status}</div>
                          </div>
                        </div>
                        <div className="text-xs font-extrabold text-emerald-600">{amt}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. JOB FEED */}
            {activeTab === "job_feed" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Icons.search size={18} className="absolute left-3.5 top-3 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5">
                      <Icons.filter size={14} /> Filter
                    </button>
                    <button className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5">
                      <Icons.sort size={14} /> Sort
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { title: "Translate Swahili Audio Snippets", cat: "Translation", pay: "$15.00", brand: "telegram" as BrandType },
                    { title: "Review E-commerce Product Photos", cat: "Data Annotation", pay: "$8.50", brand: "instagram" as BrandType },
                    { title: "Test Android App Checkout Flow", cat: "Software Testing", pay: "$20.00", brand: "google" as BrandType },
                  ].map(({ title, cat, pay, brand }) => (
                    <div key={title} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between hover:border-emerald-500 transition-all shadow-xs">
                      <div className="flex items-center gap-4">
                        <BrandIcon brand={brand} size={40} background="soft" />
                        <div>
                          <h3 className="text-xs font-bold">{title}</h3>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md">
                            {cat}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-emerald-600">{pay}</span>
                        <button className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-emerald-600">
                          <Icons.bookmark size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. JOB DETAILS */}
            {activeTab === "job_details" && (
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
                <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-4">
                    <BrandIcon brand="youtube" size={48} background="glass" />
                    <div>
                      <h2 className="text-base font-bold">YouTube Video Captioning & Subtitles</h2>
                      <p className="text-xs text-zinc-400">Posted by Global Media Corp • 2 hours ago</p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-emerald-600">$12.50</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-zinc-400">Escrow Security</div>
                    <div className="font-bold flex items-center gap-1 text-emerald-600 mt-1">
                      <Icons.escrow size={14} /> Protected
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-zinc-400">Employer Rating</div>
                    <div className="font-bold flex items-center gap-1 text-amber-500 mt-1">
                      <Icons.star size={14} /> 4.9 (120 reviews)
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-zinc-400">Est. Time</div>
                    <div className="font-bold flex items-center gap-1 mt-1">
                      <Icons.clock size={14} /> 25 Minutes
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="text-zinc-400">Attachment</div>
                    <div className="font-bold flex items-center gap-1 text-blue-500 mt-1">
                      <Icons.paperclip size={14} /> brief_v2.pdf
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center gap-2">
                    <Icons.share size={16} /> Share Task
                  </button>
                  <button className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 min-h-[44px]">
                    Apply & Start Task
                  </button>
                </div>
              </div>
            )}

            {/* 5. WALLET & ESCROW */}
            {activeTab === "wallet" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg space-y-4">
                  <div className="flex items-center justify-between text-xs opacity-90">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Icons.wallet size={16} /> Available Balance
                    </span>
                    <span className="font-mono">ZOLANZO Escrow Protection</span>
                  </div>
                  <div className="text-3xl font-black">$184.20</div>
                  <div className="flex items-center gap-3 pt-2">
                    <button className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-xs flex items-center gap-1.5 min-h-[44px]">
                      <Icons.withdrawal size={16} /> Withdraw Funds
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 font-bold text-xs flex items-center gap-1.5 min-h-[44px]">
                      <Icons.deposit size={16} /> Add Deposit
                    </button>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Transaction History</h3>
                  {[
                    { title: "Task Payout — TikTok Captioning", date: "Today, 2:40 PM", amt: "+$6.00", icon: Icons.coins },
                    { title: "Mobile Money Payout (MTN)", date: "Yesterday", amt: "-$50.00", icon: Icons.withdrawal },
                  ].map(({ title, date, amt, icon: IconComp }) => (
                    <div key={title} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                      <div className="flex items-center gap-3">
                        <IconComp size={18} className="text-emerald-600" />
                        <div>
                          <div className="font-bold">{title}</div>
                          <div className="text-[10px] text-zinc-400">{date}</div>
                        </div>
                      </div>
                      <div className="font-extrabold">{amt}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. WORKER PROFILE */}
            {activeTab === "profile" && (
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                    KM
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">Kwame Mensah</h2>
                      <Icons.verified size={18} className="text-emerald-500" />
                    </div>
                    <p className="text-xs text-zinc-400">Accra, Ghana • Member since 2024</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Connected Accounts</h3>
                  <div className="flex flex-wrap gap-2">
                    <BrandIcon brand="google" size={36} background="soft" />
                    <BrandIcon brand="facebook" size={36} background="soft" />
                    <BrandIcon brand="tiktok" size={36} background="soft" />
                    <BrandIcon brand="linkedin" size={36} background="soft" />
                  </div>
                </div>
              </div>
            )}

            {/* 7. ORG DASHBOARD */}
            {activeTab === "org_dashboard" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">Organization Portal — Enterprise Escrow</h2>
                  <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                    <Icons.add size={16} /> Post New Task
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-zinc-400">Active Campaign Pool</span>
                    <div className="text-base font-extrabold">$2,450.00</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-zinc-400">Applicants Reviewed</span>
                    <div className="text-base font-extrabold">1,420 Workers</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-zinc-400">Verification Gate</span>
                    <div className="text-base font-extrabold text-emerald-600 flex items-center gap-1">
                      <Icons.shieldCheck size={16} /> Tier 1 Active
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. SETTINGS */}
            {activeTab === "settings" && (
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <h2 className="text-base font-bold pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  Account Preferences
                </h2>
                {[
                  { title: "Security & Biometrics", icon: Icons.fingerprint, desc: "Face ID / Fingerprint login enabled" },
                  { title: "Payout Notification Alerts", icon: Icons.bell, desc: "SMS and WhatsApp Instant Alerts" },
                  { title: "Language & Region", icon: Icons.language, desc: "English (Ghana / West Africa)" },
                ].map(({ title, icon: IconComp, desc }) => (
                  <div key={title} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                    <div className="flex items-center gap-3">
                      <IconComp size={18} className="text-emerald-600" />
                      <div>
                        <div className="font-bold">{title}</div>
                        <div className="text-[10px] text-zinc-400">{desc}</div>
                      </div>
                    </div>
                    <Icons.forward size={16} className="text-zinc-400" />
                  </div>
                ))}
              </div>
            )}

            {/* 9. EMPTY STATE */}
            {activeTab === "empty_state" && (
              <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Icons.folder size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">No Active Tasks Bookmarked</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Explore available task categories and save jobs to track your progress here.
                  </p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs min-h-[44px]">
                  Browse Open Jobs
                </button>
              </div>
            )}

            {/* 10. ERROR STATE */}
            {activeTab === "error_state" && (
              <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                  <Icons.refresh size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Connection Timeout</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Unable to load micro-task payload. Check your mobile network connection and retry.
                  </p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs shadow-xs flex items-center justify-center gap-2 mx-auto min-h-[44px]">
                  <Icons.refresh size={14} /> Retry Connection
                </button>
              </div>
            )}

          </div>

          {/* Mock Mobile Bottom Bar when viewport is mobile */}
          {viewport === "mobile" && (
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-2 flex items-center justify-around text-[10px] font-semibold text-zinc-500">
              <div className="flex flex-col items-center gap-1 text-emerald-600">
                <Icons.home size={18} /> Home
              </div>
              <div className="flex flex-col items-center gap-1">
                <Icons.explore size={18} /> Jobs
              </div>
              <div className="flex flex-col items-center gap-1">
                <Icons.wallet size={18} /> Wallet
              </div>
              <div className="flex flex-col items-center gap-1">
                <Icons.profile size={18} /> Profile
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
