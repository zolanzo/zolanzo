"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/shell/app-shell";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Wallet01Icon,
  CheckmarkCircle01Icon,
  Share01Icon,
  CustomerSupportIcon,
  Settings01Icon,
  InformationCircleIcon,
  AlertCircleIcon,
  ArrowDown01Icon,
  CheckmarkBadge01Icon,
  Copy01Icon,
  BankIcon,
  Logout01Icon,
  HelpCircleIcon,
  File01Icon,
  Target01Icon,
} from "@hugeicons/core-free-icons";

type AccordionSection =
  | "profile"
  | "opportunity_preferences"
  | "wallet"
  | "health"
  | "socials"
  | "invite"
  | "support"
  | "preferences"
  | "about"
  | "danger"
  | null;

export default function SettingsPage() {
  const [expandedSection, setExpandedSection] = useState<AccordionSection>(null);

  // Preference switches state
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [fingerprintLogin, setFingerprintLogin] = useState(true);
  const [faceIdLogin, setFaceIdLogin] = useState(false);

  // OPPORTUNITY PREFERENCES STATE
  const [preferredLocations, setPreferredLocations] = useState<string[]>(["📍 Enugu", "📍 Aba", "📍 Owerri"]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minReward, setMinReward] = useState(50);

  // Preferred Social Platforms (Platform key -> bool)
  const [platformPrefs, setPlatformPrefs] = useState<Record<string, boolean>>({
    instagram: true,
    facebook: true,
    tiktok: true,
    threads: true,
    whatsapp: true,
    youtube: true,
    x: false,
    website: true,
    google_play: true,
    linkedin: false,
    telegram: false,
  });

  // Interests / Categories
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Social Media",
    "App Downloads",
    "Website Signup",
    "AI Tasks",
    "Data Entry",
    "Surveys",
  ]);

  // Availability
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([
    "Morning",
    "Evening",
    "Weekends",
    "Anytime",
  ]);

  // Smart Alerts
  const [alertMatching, setAlertMatching] = useState(true);
  const [alertHighPaying, setAlertHighPaying] = useState(true);
  const [alertNearby, setAlertNearby] = useState(true);
  const [alertReferral, setAlertReferral] = useState(true);
  const [alertWeekly, setAlertWeekly] = useState(false);

  // Career Goals
  const [selectedCareerGoals, setSelectedCareerGoals] = useState<string[]>([
    "📱 Social Media",
    "💻 Remote Work",
    "🤖 AI Tasks",
  ]);

  const toggleLocation = (loc: string) => {
    setPreferredLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleAvailability = (avail: string) => {
    setSelectedAvailability((prev) =>
      prev.includes(avail) ? prev.filter((a) => a !== avail) : [...prev, avail]
    );
  };

  const toggleCareerGoal = (goal: string) => {
    setSelectedCareerGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const togglePlatformPref = (key: string) => {
    setPlatformPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (section: AccordionSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Connected accounts list with status mappings
  const platformList = [
    { name: "Facebook", key: "facebook", status: "Verified", action: "Manage" },
    { name: "Instagram", key: "instagram", status: "Verified", action: "Manage" },
    { name: "TikTok", key: "tiktok", status: "Verified", action: "Manage" },
    { name: "Threads", key: "threads", status: "Verified", action: "Manage" },
    { name: "LinkedIn", key: "linkedin", status: "Pending", action: "Reconnect" },
    { name: "Telegram", key: "telegram", status: "Disconnected", action: "Connect" },
    { name: "WhatsApp", key: "whatsapp", status: "Verified", action: "Manage" },
    { name: "YouTube", key: "youtube", status: "Pending", action: "Reconnect" },
    { name: "X (Twitter)", key: "x", status: "Verified", action: "Manage" },
    { name: "Website", key: "website", status: "Verified", action: "Manage" },
    { name: "Google Play", key: "google_play", status: "Failed", action: "Reconnect" },
  ];

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0 py-4 pb-24 select-none">
        
        {/* HEADER BANNER */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Account Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Manage your identity, earnings, security and connected accounts.
          </p>
        </div>

        {/* 9 EXPANDABLE ACCORDION CARDS */}
        <div className="space-y-3">

          {/* 1. PROFILE ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("profile")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={UserIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Profile</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Personal identity, location details, & verification level
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "profile" ? "rotate-180 text-emerald-600" : ""
                }`}
              />
            </button>

            {expandedSection === "profile" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-200">
                {/* Profile Photo & Summary Card */}
                <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <Image
                        src="/brand/lady1.png"
                        alt="Grace Okafor"
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => alert("Photo upload initiated...")}
                        className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-lg text-[9px] font-bold shadow-xs cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-slate-900">Grace Okafor</h4>
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 block">@grace_earner</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                        Verified Creator • Level 4 Professional
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("Profile details saved successfully!")}
                    className="h-8 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">First Name</label>
                    <input
                      type="text"
                      defaultValue="Grace"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Okafor"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Username</label>
                    <input
                      type="text"
                      defaultValue="@grace_earner"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      defaultValue="+234 812 345 6789"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      defaultValue="grace.okafor@zolanzo.app"
                      className="w-full h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Occupation</label>
                    <input
                      type="text"
                      defaultValue="Digital Content Creator & Freelancer"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">State</label>
                    <input
                      type="text"
                      defaultValue="Lagos State"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City</label>
                    <input
                      type="text"
                      defaultValue="Ikeja"
                      className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between p-3 bg-slate-100/80 rounded-xl text-xs text-slate-500 font-medium">
                  <span>Date Joined: <strong className="text-slate-900">August 6, 2026</strong></span>
                  <span>Verification Status: <strong className="text-emerald-600">Level 4 Verified ✓</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 2. OPPORTUNITY PREFERENCES ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("opportunity_preferences")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Target01Icon} size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Opportunity Preferences</h3>
                    <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Match Engine ⚡
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Help Zolanzo recommend better opportunities for you.
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "opportunity_preferences" ? "rotate-180 text-teal-600" : ""
                }`}
              />
            </button>

            {expandedSection === "opportunity_preferences" && (
              <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-200 text-xs">
                
                {/* 1. PREFERRED LOCATIONS */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">1. Preferred Locations</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Remote Only</span>
                      <button
                        type="button"
                        onClick={() => setRemoteOnly(!remoteOnly)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          remoteOnly ? "bg-teal-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            remoteOnly ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {["📍 Enugu", "📍 Aba", "📍 Owerri", "📍 Lagos", "📍 Abuja", "📍 Ibadan", "📍 Port Harcourt"].map((loc) => {
                      const isSel = preferredLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`h-7 px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                            isSel
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        const newLoc = prompt("Enter new location (e.g. 📍 Kano):");
                        if (newLoc) toggleLocation(newLoc.startsWith("📍") ? newLoc : `📍 ${newLoc}`);
                      }}
                      className="h-7 px-3 rounded-full text-[11px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-all cursor-pointer"
                    >
                      ➕ Add Location
                    </button>
                  </div>
                </div>

                {/* 2. PREFERRED PLATFORMS */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">2. Preferred Platforms</span>
                  
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {platformList.map((soc) => {
                      const isConnected = soc.status === "Verified";
                      const isPreferred = !!platformPrefs[soc.key];

                      return (
                        <button
                          key={soc.key}
                          type="button"
                          onClick={() => {
                            if (isConnected) togglePlatformPref(soc.key);
                          }}
                          className={`h-9 px-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                            isPreferred && isConnected
                              ? "bg-teal-50 border-teal-300 text-teal-950 shadow-2xs"
                              : isConnected
                              ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                              : "bg-slate-50/70 border-slate-200/60 text-slate-400 opacity-80"
                          }`}
                        >
                          <SocialBrandIcon platform={soc.key} size={18} className="w-4.5 h-4.5 shrink-0" />
                          <span className="font-bold text-xs">{soc.name}</span>
                          {!isConnected && (
                            <span className="text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md shrink-0">
                              Connect
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. INTERESTS */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">3. Interests</span>
                  
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      "Social Media",
                      "App Downloads",
                      "Website Signup",
                      "AI Tasks",
                      "Data Entry",
                      "Surveys",
                      "Local Jobs",
                      "Event Staffing",
                      "Brand Promotion",
                      "Referral Campaigns",
                    ].map((interest) => {
                      const isSel = selectedInterests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`h-7.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            isSel
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isSel ? "✓ " : ""}{interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. EARNING PREFERENCE */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">4. Earning Preference</span>
                    <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                      Min Reward: ₦{minReward}
                    </span>
                  </div>

                  <div className="pt-1 space-y-1">
                    <input
                      type="range"
                      min="5"
                      max="500"
                      step="5"
                      value={minReward}
                      onChange={(e) => setMinReward(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>₦5</span>
                      <span>₦100</span>
                      <span>₦250</span>
                      <span>₦500+</span>
                    </div>
                  </div>
                </div>

                {/* 5. AVAILABILITY */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">5. Availability</span>
                  
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {["Morning", "Afternoon", "Evening", "Weekends", "Anytime"].map((avail) => {
                      const isSel = selectedAvailability.includes(avail);
                      return (
                        <button
                          key={avail}
                          type="button"
                          onClick={() => toggleAvailability(avail)}
                          className={`h-7.5 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                            isSel
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isSel ? "✓ " : ""}{avail}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. SMART ALERTS */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">6. Smart Alerts</span>
                  
                  <div className="space-y-2 pt-0.5 divide-y divide-slate-100">
                    {[
                      { title: "Matching Tasks", state: alertMatching, toggle: () => setAlertMatching(!alertMatching) },
                      { title: "High Paying Tasks", state: alertHighPaying, toggle: () => setAlertHighPaying(!alertHighPaying) },
                      { title: "Nearby Opportunities", state: alertNearby, toggle: () => setAlertNearby(!alertNearby) },
                      { title: "Referral Bonuses", state: alertReferral, toggle: () => setAlertReferral(!alertReferral) },
                      { title: "Weekly Summary", state: alertWeekly, toggle: () => setAlertWeekly(!alertWeekly) },
                    ].map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between pt-2 first:pt-0">
                        <span className="font-bold text-slate-800">{a.title}</span>
                        <button
                          type="button"
                          onClick={a.toggle}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            a.state ? "bg-teal-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              a.state ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. CAREER GOAL */}
                <div className="space-y-2 bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">7. What do you want to earn from most?</span>
                  
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      "📱 Social Media",
                      "💻 Remote Work",
                      "🤖 AI Tasks",
                      "📝 Writing",
                      "🎤 Voice",
                      "📸 Content Creation",
                      "🎪 Event Jobs",
                      "🏪 Brand Promotion",
                    ].map((goal) => {
                      const isSel = selectedCareerGoals.includes(goal);
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => toggleCareerGoal(goal)}
                          className={`h-8 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isSel
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* BOTTOM SUMMARY CARD (INFORMATIONAL ONLY, NO BUTTONS) */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">YOUR MATCH</span>
                      <span className="text-xs font-black text-emerald-700 bg-white border border-emerald-300 px-2 py-0.5 rounded-full">
                        92%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-emerald-900 flex-wrap">
                      <span>✓ 8 Platforms Connected</span>
                      <span>•</span>
                      <span>✓ 12 Categories Enabled</span>
                      <span>•</span>
                      <span>✓ 148 Matching Opportunities</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 2. WALLET & EARNINGS ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("wallet")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Wallet01Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Wallet & Earnings</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Financial metrics, bank account link, withdrawal history & payouts
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "wallet" ? "rotate-180 text-amber-600" : ""
                }`}
              />
            </button>

            {expandedSection === "wallet" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-200">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Available Balance</span>
                    <span className="text-sm font-black text-amber-600 block mt-0.5">₦12,350.00</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Review</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">₦1,250.00</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Lifetime Earnings</span>
                    <span className="text-sm font-black text-emerald-600 block mt-0.5">₦148,500.00</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Today&apos;s Earnings</span>
                    <span className="text-sm font-black text-emerald-600 block mt-0.5">₦3,200.00</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">This Week</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">₦18,400.00</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Bonuses Earned</span>
                    <span className="text-sm font-black text-amber-600 block mt-0.5">₦4,500.00</span>
                  </div>
                </div>

                {/* Linked Bank Account Card */}
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={BankIcon} size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Kuda Microfinance Bank</span>
                      <span className="text-xs text-slate-500 font-medium">Grace Okafor • Account **** 8921</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Primary Bank ✓
                  </span>
                </div>

                {/* Recent Withdrawal History & Action */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recent Withdrawal History</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">₦10,000.00 to Kuda Bank</span>
                        <span className="text-[10px] text-slate-400">Aug 5, 2026 • Instant Payout</span>
                      </div>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[10px]">
                        Successful
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/wallet"
                    className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-xs flex items-center justify-center cursor-pointer"
                  >
                    Withdraw Funds ₦
                  </Link>
                  <Link
                    href="/wallet"
                    className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                  >
                    View Full Wallet →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 3. ACCOUNT HEALTH ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("health")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Account Health</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Trust score 82% • Completion status & verification actions
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "health" ? "rotate-180 text-teal-600" : ""
                }`}
              />
            </button>

            {expandedSection === "health" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-200">
                {/* Large Progress Ring Simulation */}
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-5">
                  <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 flex items-center justify-center shrink-0">
                    <span className="text-xl font-black text-slate-900">82%</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">High Account Health Score</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Complete 2 remaining verification tasks to reach 100% and unlock priority payouts.
                    </p>
                  </div>
                </div>

                {/* Status Items List */}
                <div className="space-y-2 text-xs">
                  {[
                    { label: "Email Verified", status: "Verified ✓", done: true },
                    { label: "Phone Verified", status: "Verified ✓", done: true },
                    { label: "Bank Connected", status: "Verified ✓", done: true },
                    { label: "Payment PIN Set", status: "Verified ✓", done: true },
                    { label: "Profile Complete", status: "Verified ✓", done: true },
                    { label: "NIN Verification", status: "Incomplete", done: false },
                    { label: "Social Accounts", status: "Incomplete", done: false },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${item.done ? "text-emerald-600" : "text-amber-500"}`}>
                          {item.done ? "✓" : "🕒"}
                        </span>
                        <span className="font-bold text-slate-800">{item.label}</span>
                      </div>
                      {item.done ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                          Completed
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert(`Initiating ${item.label} process...`)}
                          className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs cursor-pointer"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. CONNECTED ACCOUNTS ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("socials")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Share01Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Connected Accounts</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official platform integrations with state indicators
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "socials" ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {expandedSection === "socials" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-2 bg-slate-50/40 animate-in fade-in duration-200">
                {platformList.map((platform) => {
                  return (
                    <div key={platform.name} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <SocialBrandIcon platform={platform.key} size={20} className="w-5 h-5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{platform.name}</span>
                          <span className={`text-[10px] font-bold ${
                            platform.status === "Verified"
                              ? "text-emerald-600"
                              : platform.status === "Pending"
                              ? "text-amber-600"
                              : platform.status === "Failed"
                              ? "text-red-500"
                              : "text-slate-500"
                          }`}>
                            {platform.status}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => alert(`${platform.action} ${platform.name} flow initiated...`)}
                        className={`h-7 px-3 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          platform.action === "Manage"
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            : platform.action === "Reconnect"
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        }`}
                      >
                        {platform.action}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. INVITE & EARN ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("invite")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Copy01Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Invite & Earn</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Referral link, QR code, stats, guide & social sharing
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "invite" ? "rotate-180 text-amber-600" : ""
                }`}
              />
            </button>

            {expandedSection === "invite" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40 animate-in fade-in duration-200 text-xs">
                {/* Referral Link & Copy */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Your Personal Referral Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="https://zolanzo.app/r/grace_earner"
                      className="flex-1 h-10 px-3 rounded-xl bg-white border border-slate-200 font-mono text-xs font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => alert("Referral link copied to clipboard!")}
                      className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Referral Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Lifetime Referrals</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">14</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Successful</span>
                    <span className="text-sm font-black text-emerald-600 block mt-0.5">12</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Bonus Earned</span>
                    <span className="text-sm font-black text-amber-600 block mt-0.5">₦14,800</span>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/80 rounded-xl text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Leaderboard Rank</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">#4</span>
                  </div>
                </div>

                {/* Referral Guide */}
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1">
                  <h4 className="font-bold text-slate-900">Referral Guide & Rules</h4>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    Earn 10% lifetime commission every time your invited friends complete a task or launch a campaign on Zolanzo. Rewards credit instantly to your wallet.
                  </p>
                </div>

                {/* Social Share Buttons */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 block">Share Directly</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => window.open("https://wa.me/?text=Join%20me%20on%20Zolanzo%20to%20earn%20money!", "_blank")}
                      className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <SocialBrandIcon platform="whatsapp" size={14} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open("https://facebook.com", "_blank")}
                      className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <SocialBrandIcon platform="facebook" size={14} />
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open("https://t.me", "_blank")}
                      className="h-9 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <SocialBrandIcon platform="telegram" size={14} />
                      <span>Telegram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open("https://x.com", "_blank")}
                      className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <SocialBrandIcon platform="x" size={14} />
                      <span>X (Twitter)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. SUPPORT ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("support")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={CustomerSupportIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Support</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Live chat, tickets, disputes, FAQs & feature requests
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "support" ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>

            {expandedSection === "support" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-2 bg-slate-50/40 animate-in fade-in duration-200 text-xs">
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between font-bold text-slate-900 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CustomerSupportIcon} size={16} className="text-indigo-600" />
                    <span>Live Chat Support</span>
                  </div>
                  <span className="text-emerald-600 font-black">24/7 Active →</span>
                </Link>
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between font-bold text-slate-900 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={File01Icon} size={16} className="text-indigo-600" />
                    <span>Open Support Ticket</span>
                  </div>
                  <span className="text-slate-400">Open →</span>
                </Link>
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between font-bold text-slate-900 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={HelpCircleIcon} size={16} className="text-indigo-600" />
                    <span>FAQ & Knowledge Base</span>
                  </div>
                  <span className="text-slate-400">View →</span>
                </Link>
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between font-bold text-slate-900 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-indigo-600" />
                    <span>Report Abuse & Campaign Disputes</span>
                  </div>
                  <span className="text-slate-400">Report →</span>
                </Link>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-slate-500 font-medium">
                  <span>Contact Email: <strong className="text-slate-900">support@zolanzo.app</strong></span>
                  <span>Avg Response Time: <strong className="text-emerald-600">&lt; 15 mins</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* 7. PREFERENCES ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("preferences")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Settings01Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">Preferences</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Theme, notifications, marketing, security PIN & biometrics
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "preferences" ? "rotate-180 text-slate-700" : ""
                }`}
              />
            </button>

            {expandedSection === "preferences" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/40 animate-in fade-in duration-200 text-xs">
                {/* Theme & Language Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">App Theme</label>
                    <select className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900">
                      <option>Daylight Light Mode</option>
                      <option>Midnight Dark Mode</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Language</label>
                    <select className="w-full h-9 px-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-900">
                      <option>English (US & NG)</option>
                    </select>
                  </div>
                </div>

                {/* Toggle Controls */}
                <div className="space-y-2">
                  <label className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-900">Push Notifications</span>
                    <input
                      type="checkbox"
                      checked={pushNotifs}
                      onChange={(e) => setPushNotifs(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                  </label>

                  <label className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-900">SMS Security Alerts</span>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                  </label>

                  <label className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-900">Marketing & Campaign Emails</span>
                    <input
                      type="checkbox"
                      checked={marketingEmails}
                      onChange={(e) => setMarketingEmails(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                  </label>

                  <label className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-900">Fingerprint Login</span>
                    <input
                      type="checkbox"
                      checked={fingerprintLogin}
                      onChange={(e) => setFingerprintLogin(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                  </label>

                  <label className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-slate-900">Face ID Authentication</span>
                    <input
                      type="checkbox"
                      checked={faceIdLogin}
                      onChange={(e) => setFaceIdLogin(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                  </label>
                </div>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">4-Digit Security PIN</span>
                    <span className="text-slate-500">Authorized for withdrawals</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert("PIN reset email sent to your address.")}
                    className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Change PIN
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 8. ABOUT ACCORDION */}
          <div className="bg-white border border-slate-200/80 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("about")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={InformationCircleIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">About</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Version v4.2.0, terms, privacy, community rules & open source credits
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-slate-400 transition-transform duration-300 ${
                  expandedSection === "about" ? "rotate-180 text-slate-700" : ""
                }`}
              />
            </button>

            {expandedSection === "about" && (
              <div className="p-5 pt-2 border-t border-slate-100 space-y-2 bg-slate-50/40 animate-in fade-in duration-200 text-xs">
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-900">App Version</span>
                  <span className="font-mono font-bold text-slate-500">v4.2.0 (Daylight Release)</span>
                </div>
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center font-bold text-slate-900 hover:bg-slate-50">
                  <span>Terms of Service</span>
                  <span className="text-slate-400">Read →</span>
                </Link>
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center font-bold text-slate-900 hover:bg-slate-50">
                  <span>Privacy Policy</span>
                  <span className="text-slate-400">Read →</span>
                </Link>
                <Link href="/support" className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center font-bold text-slate-900 hover:bg-slate-50">
                  <span>Community Guidelines & Rules</span>
                  <span className="text-slate-400">Read →</span>
                </Link>
                <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex justify-between items-center font-bold text-slate-900">
                  <span>Open Source Licenses & Credits</span>
                  <span className="text-slate-400">View Credits →</span>
                </div>
              </div>
            )}
          </div>

          {/* 9. DANGER ZONE ACCORDION (RED STYLING ONLY) */}
          <div className="bg-white border border-red-200 rounded-[20px] shadow-soft overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("danger")}
              className="w-full p-4.5 flex items-center justify-between hover:bg-red-50/50 transition-colors cursor-pointer text-left bg-red-50/20"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={AlertCircleIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-600 leading-tight">Danger Zone</h3>
                  <p className="text-xs text-red-500 font-medium mt-0.5">
                    Deactivate, delete account, export data & sign out
                  </p>
                </div>
              </div>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className={`text-red-400 transition-transform duration-300 ${
                  expandedSection === "danger" ? "rotate-180 text-red-600" : ""
                }`}
              />
            </button>

            {expandedSection === "danger" && (
              <div className="p-5 pt-2 border-t border-red-200 space-y-3 bg-red-50/30 animate-in fade-in duration-200 text-xs">
                <div className="p-3 bg-white border border-red-200 rounded-xl space-y-1">
                  <span className="font-bold text-red-700 block">Account Actions Warning</span>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Actions taken in the Danger Zone are sensitive. Deactivating or deleting your account will lock access to active earnings and reputation records.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => alert("Data export link generated.")}
                    className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Export My Data
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Deactivation flow initiated.")}
                    className="h-10 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition-all border border-amber-200 cursor-pointer"
                  >
                    Deactivate Account
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Delete account flow initiated.")}
                    className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-xs cursor-pointer sm:col-span-2"
                  >
                    Delete Account Permanently
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* SIGN OUT BUTTON */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => alert("Signed out successfully.")}
            className="w-full h-11 rounded-[18px] bg-red-50 hover:bg-red-100 border border-red-200/80 text-red-600 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </AppShell>
  );
}


