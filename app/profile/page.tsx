"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  Shield01Icon,
  PencilEdit01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { IdentityCenterModal } from "@/components/profile/identity-center-modal";

type ProfileTab = "Personal" | "Skills & Certifications" | "Achievements & Badges";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Personal");
  const [editOpen, setEditOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Grace Adebayo",
    role: "Top Tier Earner",
    city: "Lagos",
    country: "Nigeria",
    phone: "+234 803 **** 890",
    email: "grace.adebayo@example.com",
    approvalRate: "98.4%",
    totalEarned: "₦1,840,000",
    completedTasks: "932",
    skills: ["AI Annotation", "Data Entry", "Virtual Assistance", "Content Proofreading", "Customer Support"],
    languages: ["English (Fluent)", "Yoruba (Native)"],
    verifications: [
      { name: "Identity Verification (NIN)", verified: true },
      { name: "Phone OTP Verified", verified: true },
      { name: "Email Verified", verified: true },
      { name: "Bank Account Linked", verified: true },
    ],
  });

  const handleSaved = (name: string, city: string) => {
    setProfile((prev) => ({ ...prev, fullName: name, city }));
  };

  return (
    <AppShell userName={profile.fullName} avatarUrl="/brand/lady1.png">
      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />

      <IdentityCenterModal
        isOpen={identityOpen}
        onClose={() => setIdentityOpen(false)}
      />

      <div className="max-w-[1000px] mx-auto space-y-8 pb-20">
        
        {/* Profile Card Header */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative">
              <Image
                src="/brand/lady1.png"
                alt={profile.fullName}
                width={100}
                height={100}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-emerald-500/40 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#008744] text-white flex items-center justify-center border-2 border-[#0A0F12]">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-black text-white">{profile.fullName}</h1>
                  <p className="text-xs text-zinc-400 font-medium">{profile.city}, {profile.country} • Joined 2025</p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="h-[38px] px-4 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Profile Completion Bar */}
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-300">Profile Strength</span>
                  <span className="text-emerald-400">100% Completed</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          {(["Personal", "Skills & Certifications", "Achievements & Badges"] as ProfileTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "bg-[#008744]/20 border border-[#008744] text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Lifetime Earnings</span>
            <span className="text-2xl font-black text-emerald-400 block">{profile.totalEarned}</span>
            <span className="text-[11px] text-zinc-400">100% Disbursed</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Approval Rating</span>
            <span className="text-2xl font-black text-white block">{profile.approvalRate}</span>
            <span className="text-[11px] text-emerald-400 font-bold">★★★★★ Verified</span>
          </div>

          <div className="bg-[#0A0F12] border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Tasks Completed</span>
            <span className="text-2xl font-black text-white block">{profile.completedTasks}</span>
            <span className="text-[11px] text-zinc-400">Completed Submissions</span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "Personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact & Languages</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Phone</span>
                  <span className="text-white font-mono">{profile.phone}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-2">
                  <span className="text-zinc-400">Email</span>
                  <span className="text-white font-mono">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Languages</span>
                  <span className="text-emerald-400 font-bold">{profile.languages.join(", ")}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trust & Security Badges</h3>
                <button
                  type="button"
                  onClick={() => setIdentityOpen(true)}
                  className="px-3 py-1 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Identity Center
                </button>
              </div>
              <div className="space-y-2.5">
                {profile.verifications.map((v, i) => (
                  <div key={i} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-zinc-200 font-medium">
                      <HugeiconsIcon icon={Shield01Icon} size={16} className="text-emerald-400" />
                      <span>{v.name}</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-[11px]">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Skills & Certifications" && (
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, i) => (
                <span key={i} className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Achievements & Badges" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <HugeiconsIcon icon={StarIcon} size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Top 1% Earner</p>
                <p className="text-[10px] text-zinc-400">Earned ₦1M+ on platform</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Fast Responder</p>
                <p className="text-[10px] text-zinc-400">Submits work under estimated time</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
