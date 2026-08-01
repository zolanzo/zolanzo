"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Share01Icon,
  Robot01Icon,
  ClipboardListIcon,
  PencilEdit01Icon,
  HeadsetIcon,
  Coins01Icon,
  AnalyticsUpIcon,
  UserGroupIcon,
  CheckmarkBadge01Icon,
  CursorPointer01Icon,
  CheckmarkCircle01Icon,
  Wallet01Icon,
  Shield01Icon,
  SmartPhone01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  CircleLock01Icon,
  Clock01Icon,
  Chart01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { Navbar } from "@/components/navigation/navbar";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const successStories = [
    { name: "Grace A.", city: "Lagos", country: "Nigeria", amount: "₦384,000 earned", text: "Reliable way to earn extra income each month after my main job.", joined: "Joined 2025", initial: "GA" },
    { name: "Samuel K.", city: "Accra", country: "Ghana", amount: "₦520,000 earned", text: "Work on AI data projects from anywhere while studying at university.", joined: "Joined 2025", initial: "SK" },
    { name: "Amina H.", city: "Abuja", country: "Nigeria", amount: "₦1.85M disbursed", text: "Recruited verified workers quickly for our mobile app launch campaign.", joined: "Verified Employer", initial: "AH" },
    { name: "David O.", city: "Port Harcourt", country: "Nigeria", amount: "₦410,000 earned", text: "Instant bank withdrawals work every single time without delay.", joined: "Joined 2025", initial: "DO" },
    { name: "Blessing E.", city: "Benin", country: "Nigeria", amount: "₦290,000 earned", text: "Great platform for flexible side income on weekends.", joined: "Joined 2025", initial: "BE" },
    { name: "Kofi M.", city: "Kumasi", country: "Ghana", amount: "₦640,000 earned", text: "Completed over 1,500 survey microtasks during my free time.", joined: "Top Earner", initial: "KM" },
    { name: "Ada N.", city: "Enugu", country: "Nigeria", amount: "₦375,000 earned", text: "Proofreading tasks match my schedule perfectly.", joined: "Joined 2025", initial: "AN" },
    { name: "Emmanuel T.", city: "Ibadan", country: "Nigeria", amount: "₦480,000 earned", text: "AI model labeling tasks pay very well for attentive work.", joined: "Pro Contributor", initial: "ET" },
    { name: "Zainab B.", city: "Kano", country: "Nigeria", amount: "₦1.45M disbursed", text: "Hired top remote chat support workers for our e-commerce business.", joined: "Verified Employer", initial: "ZB" },
    { name: "Chioma U.", city: "Asaba", country: "Nigeria", amount: "₦310,000 earned", text: "User-friendly interface and transparent payout tracking.", joined: "Joined 2025", initial: "CU" },
    { name: "Tariq S.", city: "Nairobi", country: "Kenya", amount: "₦720,000 earned", text: "Highest quality digital work platform in Africa.", joined: "Top Earner", initial: "TS" },
    { name: "Funke O.", city: "Abeokuta", country: "Nigeria", amount: "₦265,000 earned", text: "Quick social media tasks during breaks pay instantly to my bank.", joined: "Joined 2025", initial: "FO" },
  ];

  const faqs = [
    {
      question: "Who can join ZOLANZO?",
      answer: "Anyone who meets our platform requirements can create a free account on ZOLANZO. Whether you're a student, freelancer, remote worker, stay-at-home parent, or professional looking to earn extra income, you'll be able to explore available opportunities that match your skills and experience."
    },
    {
      question: "How do I get paid?",
      answer: "Once your completed task has been reviewed and approved, your earnings are credited to your ZOLANZO wallet. You can request a withdrawal to your supported local bank account whenever your available balance meets the minimum withdrawal requirement."
    },
    {
      question: "How long does task approval take?",
      answer: "Approval times depend on the employer and the type of task you've completed. Many simple tasks are reviewed within a few hours, while larger projects may take a little longer. You'll always be able to monitor the status of every submission from your dashboard."
    },
    {
      question: "Can I work from my phone?",
      answer: "Yes. Many opportunities on ZOLANZO are designed specifically for smartphones. Some advanced projects may require a laptop or desktop computer, but the platform clearly indicates any device requirements before you apply."
    },
    {
      question: "Are employers verified?",
      answer: "We review employers before campaigns are published to help maintain trust and quality across the marketplace. While verification helps improve platform safety, we also encourage workers to review task details carefully before accepting any opportunity."
    },
    {
      question: "How do businesses hire workers?",
      answer: "Businesses can create campaigns, define task requirements, set budgets, and securely fund projects through escrow. Once a campaign is approved, qualified workers can begin completing tasks while employers monitor progress and performance from their dashboard."
    },
    {
      question: "Is it free to join ZOLANZO?",
      answer: "Yes. Creating a ZOLANZO account is free. Once your account is set up, you can browse available opportunities, build your profile, and start applying for suitable tasks without paying any registration fee."
    },
    {
      question: "What kinds of jobs are available?",
      answer: "ZOLANZO offers a growing variety of digital opportunities including AI training, surveys, social media engagement, writing, customer support, virtual assistance, data-related projects, and many other remote tasks from verified employers."
    },
    {
      question: "Can I complete more than one task at a time?",
      answer: "Yes, provided you meet the requirements for each task and can complete them within the stated deadlines. Managing multiple tasks responsibly can help you increase your earnings while maintaining a strong approval rating."
    },
    {
      question: "How does ZOLANZO protect workers?",
      answer: "We use employer reviews, secure escrow payments, platform moderation, and quality checks to help create a safer marketplace for everyone. We continuously monitor campaigns and investigate reports to maintain a trusted environment for both workers and employers."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans overflow-x-hidden">
      {/* SECTION 1 — NAVIGATION */}
      <Navbar />

      {/* SECTION 1 — HERO */}
      <section className="relative w-full bg-white text-zinc-950 overflow-hidden border-b border-zinc-100 pb-5 sm:pb-7">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/25 via-emerald-50/15 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-7 relative z-10">
          
          {/* Top Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[54%_46%] gap-5 items-center">
            
            {/* Left Column */}
            <div className="w-full max-w-[640px] text-left flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-2.5">
                <span className="w-2 h-2 rounded-full bg-[#008744] animate-pulse" />
                <span>Africa&apos;s #1 Digital Workforce Marketplace</span>
              </div>

              <h1 className="text-[40px] sm:text-[52px] lg:text-[60px] xl:text-[64px] font-black tracking-[-0.05em] leading-[1.04] text-zinc-950 text-left space-y-1.5">
                <span className="block">
                  Work that <span className="text-[#008744] font-black">pays.</span>
                </span>
                <span className="block">
                  Impact that <span className="text-[#008744] font-black">lasts.</span>
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 font-medium max-w-[500px] leading-relaxed mt-2.5 text-left">
                Simple online tasks. Real income.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 w-full sm:w-auto">
                <Link
                  href="/tasks"
                  className="h-[48px] px-8 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-[15px] transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-[2px] flex items-center justify-center gap-2 group w-full sm:w-auto"
                >
                  Find Work <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/signup"
                  className="h-[48px] px-8 rounded-xl border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 bg-white text-zinc-950 font-bold text-[15px] transition-all duration-200 hover:-translate-y-[2px] flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-zinc-800" /> Hire Talent
                </Link>
              </div>
            </div>

            {/* Right Lady Talent Artwork */}
            <div className="w-full flex items-end justify-center lg:justify-end self-end">
              <div className="relative w-full max-w-[480px] lg:max-w-none flex items-end justify-center lg:justify-end">
                <Image
                  src="/brand/lady1.png"
                  alt="ZOLANZO Talent displaying mobile app interface"
                  width={620}
                  height={620}
                  priority
                  className="w-auto h-auto max-h-[400px] sm:max-h-[480px] lg:max-h-[520px] object-contain object-bottom select-none drop-shadow-md"
                />
              </div>
            </div>

          </div>

          {/* WORKER PRODUCT INTERFACE */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <Link href="/earner/dashboard" className="block group">
              <div className="bg-[#04090B] rounded-3xl p-4 sm:p-6 border border-zinc-800 shadow-2xl group-hover:border-emerald-500/40 transition-all duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Earner Product Interface</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                      <HugeiconsIcon icon={Notification01Icon} size={14} className="text-emerald-400" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 group-hover:bg-[#008744] group-hover:text-white transition-colors">
                      Launch Earner Dashboard →
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3">
                  <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Today&apos;s Earnings</span>
                    <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">₦18,400</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Wallet Balance</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block">₦283,600</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Tasks Completed</span>
                    <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">932</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION 2 — CATEGORIES */}
      <section className="w-full bg-zinc-50/60 py-2.5 border-b border-zinc-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { icon: Share01Icon, label: "Social Media" },
              { icon: Robot01Icon, label: "AI Training" },
              { icon: ClipboardListIcon, label: "Surveys" },
              { icon: PencilEdit01Icon, label: "Writing" },
              { icon: HeadsetIcon, label: "Virtual Assistant" },
            ].map((cat, i) => (
              <Link key={i} href="/tasks" className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer hover:bg-white hover:shadow-xs rounded-xl transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#008744] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <HugeiconsIcon icon={cat.icon} size={20} className="text-[#008744]" />
                </div>
                <span className="text-[11px] sm:text-[12px] font-semibold text-zinc-900 leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}

            <Link href="/tasks" className="flex flex-col items-center justify-center p-2 text-center group cursor-pointer hover:bg-white hover:shadow-xs rounded-xl transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
              </div>
              <span className="text-[11px] sm:text-[12px] font-bold text-zinc-950 leading-tight">
                Browse More →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PLATFORM STATISTICS */}
      <section className="w-full bg-white py-4 border-b border-zinc-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 gap-2 sm:gap-0">
            <div className="flex items-center gap-3 p-1.5 sm:justify-center">
              <HugeiconsIcon icon={Coins01Icon} size={22} className="text-[#008744] shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">18M+</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">Paid to workers</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 sm:justify-center">
              <HugeiconsIcon icon={AnalyticsUpIcon} size={22} className="text-[#D97706] shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">58,000+</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">Tasks completed</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 sm:justify-center">
              <HugeiconsIcon icon={UserGroupIcon} size={22} className="text-[#008744] shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">21,000+</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">Active earners</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 sm:justify-center">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={22} className="text-[#008744] shrink-0" />
              <div>
                <p className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">98%</p>
                <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">Approval rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — AVAILABLE TASKS */}
      <section className="w-full bg-zinc-50/50 py-6 sm:py-8 border-b border-zinc-100" id="available-tasks">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center mb-4 sm:mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Available Tasks
            </h2>
            <div className="w-12 h-1 bg-[#008744] mx-auto mt-1.5 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Task 1 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#008744] text-[11px] font-bold border border-emerald-100">
                      New
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-semibold">
                      AI Project
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1"><HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified</span>
                </div>

                <h3 className="text-base font-bold text-zinc-950">AI Model Image Labeling</h3>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                  <span className="flex items-center gap-1"><HugeiconsIcon icon={Clock01Icon} size={14} /> 18 mins</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">23 Earners Active</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-medium block uppercase tracking-wider">Reward</span>
                  <span className="text-xl font-black text-[#008744]">₦850</span>
                </div>
                <Link href="/tasks" className="h-[36px] px-3.5 rounded-xl bg-zinc-900 hover:bg-[#008744] text-white text-xs font-bold transition-colors flex items-center gap-1">
                  Apply Task <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </div>
            </div>

            {/* Task 2 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#008744] text-[11px] font-bold border border-emerald-100">
                      Trending
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-semibold">
                      Quick Task
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1"><HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified</span>
                </div>

                <h3 className="text-base font-bold text-zinc-950">Brand Post Engagement</h3>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                  <span className="flex items-center gap-1"><HugeiconsIcon icon={Clock01Icon} size={14} /> 5 mins</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">147 Slots Left</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-medium block uppercase tracking-wider">Reward</span>
                  <span className="text-xl font-black text-[#008744]">₦350</span>
                </div>
                <Link href="/tasks" className="h-[36px] px-3.5 rounded-xl bg-zinc-900 hover:bg-[#008744] text-white text-xs font-bold transition-colors flex items-center gap-1">
                  Apply Task <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </div>
            </div>

            {/* Task 3 */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-100">
                      High Pay
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-semibold">
                      Support
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1"><HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} /> Verified</span>
                </div>

                <h3 className="text-base font-bold text-zinc-950">Customer Live Chat Support</h3>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                  <span className="flex items-center gap-1"><HugeiconsIcon icon={Clock01Icon} size={14} /> 2 hrs</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">8 Earners Active</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-400 font-medium block uppercase tracking-wider">Reward</span>
                  <span className="text-xl font-black text-[#008744]">₦5,000</span>
                </div>
                <Link href="/tasks" className="h-[36px] px-3.5 rounded-xl bg-zinc-900 hover:bg-[#008744] text-white text-xs font-bold transition-colors flex items-center gap-1">
                  Apply Task <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </div>
            </div>

          </div>

          <div className="mt-4 sm:mt-5 flex justify-center">
            <Link
              href="/tasks"
              className="h-[42px] px-6 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all duration-200 shadow-xs hover:-translate-y-[1px]"
            >
              View All Marketplace Tasks →
            </Link>
          </div>

        </div>
      </section>

      {/* SECTION 5 — HOW IT WORKS */}
      <section className="w-full bg-white py-6 sm:py-8 border-b border-zinc-100" id="how-it-works">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              How It Works
            </h2>
            <div className="w-12 h-1 bg-[#008744] mx-auto mt-1.5 rounded-full" />
          </div>

          <div className="max-w-[840px] mx-auto relative">
            <div className="hidden sm:block absolute top-6 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-500 to-emerald-200 z-0" />

            <div className="grid grid-cols-3 gap-3 relative z-10 text-center">
              <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#008744] to-[#006e37] text-white flex items-center justify-center shadow-xs">
                  <HugeiconsIcon icon={CursorPointer01Icon} size={22} />
                </div>
                <span className="text-[11px] font-bold text-[#008744] uppercase tracking-wider">Step 1</span>
                <p className="text-xs font-bold text-zinc-900 leading-tight">Choose a task</p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#008744] to-[#006e37] text-white flex items-center justify-center shadow-xs">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} />
                </div>
                <span className="text-[11px] font-bold text-[#008744] uppercase tracking-wider">Step 2</span>
                <p className="text-xs font-bold text-zinc-900 leading-tight">Complete it</p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#008744] to-[#006e37] text-white flex items-center justify-center shadow-xs">
                  <HugeiconsIcon icon={Wallet01Icon} size={22} />
                </div>
                <span className="text-[11px] font-bold text-[#008744] uppercase tracking-wider">Step 3</span>
                <p className="text-xs font-bold text-zinc-900 leading-tight">Get paid</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6 — EARNER & HIRE DASHBOARDS */}
      <section className="w-full bg-zinc-50/50 py-6 sm:py-8 border-b border-zinc-100" id="hire-talent">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Product Dashboards
            </h2>
            <div className="w-12 h-1 bg-[#008744] mx-auto mt-1.5 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Left: Earner Dashboard Preview */}
            <Link href="/earner/dashboard" className="block group">
              <div className="bg-[#04090B] rounded-3xl p-5 sm:p-7 border border-zinc-800 shadow-2xl group-hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between space-y-4 h-full">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Earner Dashboard</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 group-hover:bg-[#008744] group-hover:text-white transition-colors">
                    Launch Earner Dashboard →
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Today&apos;s Earnings</span>
                    <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">₦18,400</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Wallet Balance</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5 block">₦283,600</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Tasks Completed</span>
                    <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">932</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 block">Activity Timeline</span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-zinc-200 font-medium">AI Model Image Labeling</span>
                    </div>
                    <span className="text-emerald-400 font-bold">+₦850</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Right: Hire Dashboard Preview */}
            <Link href="/hire/dashboard" className="block group">
              <div className="bg-[#04090B] rounded-3xl p-5 sm:p-7 border border-zinc-800 shadow-2xl group-hover:border-purple-500/40 transition-all duration-200 flex flex-col justify-between space-y-4 h-full">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Hire Dashboard</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-semibold border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    Launch Hire Dashboard →
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Campaign Budget</span>
                    <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">₦450,000</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Earners Active</span>
                    <span className="text-lg sm:text-xl font-black text-purple-400 mt-0.5 block">1,420</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Quality Score</span>
                    <span className="text-lg sm:text-xl font-black text-white mt-0.5 block">96.8%</span>
                  </div>
                </div>

                <div className="bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Chart01Icon} size={14} className="text-purple-400" />
                      <span className="text-zinc-300">Campaign Progress</span>
                    </div>
                    <span className="text-purple-400 font-bold">85% Complete</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full w-[85%]" />
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* SECTION 7 — WHY CHOOSE ZOLANZO */}
      <section className="w-full bg-white py-6 sm:py-8 border-b border-zinc-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Why Choose ZOLANZO
            </h2>
            <div className="w-12 h-1 bg-[#008744] mx-auto mt-1.5 rounded-full" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1 text-center hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200">
              <HugeiconsIcon icon={Shield01Icon} size={22} className="text-[#008744] mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-zinc-950">Verified Employers</h4>
              <p className="text-[11px] text-zinc-500 leading-normal">Campaigns reviewed before publishing.</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1 text-center hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200">
              <HugeiconsIcon icon={CircleLock01Icon} size={22} className="text-[#008744] mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-zinc-950">Escrow Protection</h4>
              <p className="text-[11px] text-zinc-500 leading-normal">Funds locked until tasks are approved.</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1 text-center hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200">
              <HugeiconsIcon icon={Wallet01Icon} size={22} className="text-[#008744] mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-zinc-950">Fast Withdrawals</h4>
              <p className="text-[11px] text-zinc-500 leading-normal">Direct payout to local bank account.</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1 text-center hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200">
              <HugeiconsIcon icon={SmartPhone01Icon} size={22} className="text-[#008744] mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-zinc-950">Work Anywhere</h4>
              <p className="text-[11px] text-zinc-500 leading-normal">Complete work from phone or PC.</p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 8 — SUCCESS STORIES */}
      <section className="w-full bg-zinc-50/50 py-6 sm:py-8 border-b border-zinc-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
                Success Stories
              </h2>
              <div className="w-12 h-1 bg-[#008744] mt-1.5 rounded-full" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 hidden sm:inline-block">
              Swipe horizontal to explore →
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-1 pb-3 scrollbar-none scroll-smooth">
            {successStories.map((story, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[340px] p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs hover:shadow-md hover:border-zinc-300 hover:-translate-y-[2px] transition-all duration-200 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#008744] font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/80">
                        {story.initial}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-950">{story.name}</h4>
                        <p className="text-xs text-zinc-500 font-medium">{story.city}, {story.country}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 italic leading-relaxed">&ldquo;{story.text}&rdquo;</p>
                </div>

                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs font-black text-[#008744]">{story.amount}</span>
                  <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                    {story.joined}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 9 — FREQUENTLY ASKED QUESTIONS */}
      <section className="w-full bg-white py-6 sm:py-8 border-b border-zinc-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="w-12 h-1 bg-[#008744] mx-auto mt-1.5 rounded-full" />
            <p className="text-xs sm:text-sm text-zinc-600 font-medium max-w-[620px] mx-auto mt-2 leading-relaxed">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="max-w-[800px] mx-auto divide-y divide-zinc-200/80">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-2 flex items-center justify-between gap-4 text-left font-bold text-zinc-950 text-base sm:text-lg hover:text-[#008744] transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={20}
                      className={`text-[#008744] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="pt-2 pb-2">
                      <p className="text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 10 — FINAL CTA */}
      <section className="w-full bg-white py-5 sm:py-6 mb-8 sm:mb-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="bg-[#04090B] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden text-center flex flex-col items-center justify-center shadow-2xl shadow-emerald-950/20 border border-white/[0.08]">
            
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/12 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10 max-w-[650px] mx-auto flex flex-col items-center">
              <p className="text-xs font-semibold text-emerald-400 tracking-wide mb-2.5">
                Trusted by thousands across Africa
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] sm:leading-[1.12]">
                Ready to build your digital future?
              </h2>
              
              <p className="text-sm sm:text-base text-zinc-400 font-medium mt-3 leading-relaxed">
                Start earning online or hire trusted talent through one secure platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-6 w-full sm:w-auto">
                <Link
                  href="/tasks"
                  className="h-[52px] sm:h-[56px] px-8 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto shadow-md hover:-translate-y-[2px]"
                >
                  Find Work <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Link>

                <Link
                  href="/signup"
                  className="h-[52px] sm:h-[56px] px-8 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/10 text-white font-bold text-[15px] transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto hover:-translate-y-[2px]"
                >
                  Hire Talent <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11 — FOOTER */}
      <footer className="w-full bg-[#04090B] text-white pt-10 pb-6 border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center md:text-left">
            
            {/* Brand Column */}
            <div className="space-y-3 flex flex-col items-center md:items-start lg:col-span-1">
              <Link href="/">
                <Image src="/brand/dark-theme-logo.webp" alt="ZOLANZO Logo" width={155} height={40} className="h-[36px] w-auto object-contain" />
              </Link>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                Africa&apos;s premium workforce marketplace connecting micro-taskers with real digital work.
              </p>
            </div>

            {/* Products Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">Products</h3>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li><Link href="/tasks" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/earner/dashboard" className="hover:text-white transition-colors">Earn Dashboard</Link></li>
                <li><Link href="/hire/dashboard" className="hover:text-white transition-colors">Hire Dashboard</Link></li>
                <li><Link href="/wallet" className="hover:text-white transition-colors">Wallet</Link></li>
              </ul>
            </div>

            {/* Earners Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">Earners</h3>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li><Link href="/tasks" className="hover:text-white transition-colors">Find Work</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="/wallet" className="hover:text-white transition-colors">Wallet</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Businesses Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">Businesses</h3>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li><Link href="/signup" className="hover:text-white transition-colors">Post a Task</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Hire Talent</Link></li>
                <li><Link href="/hire/dashboard" className="hover:text-white transition-colors">Hire Dashboard</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>

            {/* Account Column */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase">Account</h3>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Log In</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/forgot-pin" className="hover:text-white transition-colors">Reset PIN</Link></li>
                <li><Link href="/verify-email" className="hover:text-white transition-colors">Verify Email</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-5 text-center text-xs text-zinc-500 space-y-1">
            <p>© 2026 ZOLANZO LTD. All rights reserved.</p>
            <p className="text-[11px] text-zinc-500">
              A Stankings Company •{" "}
              <a href="https://stankings.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline underline-offset-4">
                stankings.com
              </a>
            </p>
          </div>
        </div>
      </footer>

      <main className="flex-1" />
    </div>
  );
}
