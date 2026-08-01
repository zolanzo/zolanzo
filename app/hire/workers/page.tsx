"use client";

import React, { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CheckmarkBadge01Icon,
  StarIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

interface WorkerTalent {
  id: string;
  name: string;
  avatar: string;
  country: string;
  approvalRate: string;
  completedTasks: number;
  rating: string;
  skills: string[];
  languages: string[];
  verified: boolean;
}

export default function WorkersDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const workers: WorkerTalent[] = [
    {
      id: "w_1",
      name: "Grace Adebayo",
      avatar: "/brand/lady1.png",
      country: "Nigeria",
      approvalRate: "98.4%",
      completedTasks: 932,
      rating: "4.9",
      skills: ["AI Annotation", "Data Entry", "Content Proofreading"],
      languages: ["English", "Yoruba"],
      verified: true,
    },
    {
      id: "w_2",
      name: "Chidi Okonkwo",
      avatar: "/brand/lady1.png",
      country: "Nigeria",
      approvalRate: "99.1%",
      completedTasks: 1420,
      rating: "5.0",
      skills: ["Usability Testing", "Customer Support", "Research"],
      languages: ["English", "Igbo"],
      verified: true,
    },
    {
      id: "w_3",
      name: "Fatima Bello",
      avatar: "/brand/lady1.png",
      country: "Ghana",
      approvalRate: "97.8%",
      completedTasks: 410,
      rating: "4.8",
      skills: ["Live Chat", "Data Verification", "Transcription"],
      languages: ["English", "Hausa"],
      verified: true,
    },
  ];

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell userName="Amina" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1440px] mx-auto space-y-6 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Verified Workforce Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                1,420 Active Contributors
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Discover top-rated digital workers by skill, approval rating, language, and verified identity.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <HugeiconsIcon icon={Search01Icon} size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers by name or skill..."
            className="w-full h-[44px] pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Workers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.map((w) => (
            <div
              key={w.id}
              className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <Image
                      src={w.avatar}
                      alt={w.name}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#008744] text-white flex items-center justify-center border-2 border-[#0A0F12]">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white">{w.name}</h3>
                    <p className="text-xs text-zinc-400 font-medium">{w.country} • {w.languages.join(", ")}</p>
                    <div className="flex items-center gap-1.5 text-xs pt-1">
                      <span className="text-amber-400 font-bold flex items-center gap-0.5">
                        <HugeiconsIcon icon={StarIcon} size={12} /> {w.rating}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-emerald-400 font-bold">{w.approvalRate} Approval Rate</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Completed Opportunities</span>
                  <span className="text-white font-bold">{w.completedTasks} Submissions</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {w.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => alert(`Invitation sent to ${w.name}!`)}
                  className="w-full h-[40px] rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <HugeiconsIcon icon={Mail01Icon} size={16} />
                  <span>Invite to Opportunity</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
