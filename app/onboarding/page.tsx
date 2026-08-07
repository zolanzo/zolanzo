"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Globe02Icon,
  Location01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Building01Icon,
} from "@hugeicons/core-free-icons";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthCard } from "@/components/auth/auth-card";
import { ValidationMessage } from "@/components/auth/validation-message";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Profile Form State (Stored role from registration)
  const [role] = useState<"worker" | "employer">("worker");
  const [country, setCountry] = useState("Nigeria");
  const [stateProv, setStateProv] = useState("Lagos");
  const [city, setCity] = useState("Lagos");
  const [language, setLanguage] = useState("English");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [website, setWebsite] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNextStep = () => {
    setError("");
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleCompleteLater = () => {
    // Complete Later does not block access — route directly to role dashboard
    const destination = role === "worker" ? "/earner/dashboard" : "/hirer/dashboard";
    router.push(destination);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          country,
          state: stateProv,
          city,
          language,
          companyName,
          industry,
          website,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Onboarding submission failed.");
        return;
      }

      // Automatic Dashboard Routing based on stored role
      const destination = role === "worker" ? "/earner/dashboard" : "/hirer/dashboard";
      router.push(destination);
    } catch {
      setLoading(false);
      setError("An unexpected network error occurred.");
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[540px] mx-auto space-y-6">
        
        {/* Progress Indicator (3 Steps) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span className="text-emerald-400 uppercase tracking-wider">Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% Complete</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#008744] to-emerald-400 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <AuthCard>
          <ValidationMessage message={error} />

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center space-y-6 py-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#008744] mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} className="text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Welcome to ZOLANZO
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-[380px] mx-auto">
                  Let&apos;s get everything ready in just a minute.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </button>

                <Link
                  href="/"
                  className="w-full h-[48px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>Back Home</span>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: COMPLETE PROFILE (DYNAMIC BASED ON STORED ROLE) */}
          {step === 2 && (
            <div className="space-y-4 py-1 text-left">
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">Complete Profile</h2>
                <p className="text-xs text-zinc-400">
                  {role === "worker" ? "Set your location & language preferences for Earn opportunities." : "Tell us about your organization for Hire campaigns."}
                </p>
              </div>

              {role === "worker" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Country</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <HugeiconsIcon icon={Globe02Icon} size={18} />
                      </div>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      >
                        <option value="Nigeria">Nigeria 🇳🇬</option>
                        <option value="Ghana">Ghana 🇬🇭</option>
                        <option value="Kenya">Kenya 🇰🇪</option>
                        <option value="South Africa">South Africa 🇿🇦</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">State / Province</label>
                      <input
                        type="text"
                        value={stateProv}
                        onChange={(e) => setStateProv(e.target.value)}
                        placeholder="e.g. Lagos"
                        className="w-full h-[48px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Ikeja"
                        className="w-full h-[48px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Preferred Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full h-[48px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                    >
                      <option value="English">English</option>
                      <option value="French">French</option>
                      <option value="Swahili">Swahili</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Company Name</label>
                      <span className="text-[10px] text-zinc-500 uppercase">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <HugeiconsIcon icon={Building01Icon} size={18} />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Stankings Technologies"
                        className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full h-[48px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                    >
                      <option value="Technology">Technology & Software</option>
                      <option value="AI & Data">AI Data & Machine Learning</option>
                      <option value="E-Commerce">E-Commerce & Retail</option>
                      <option value="Finance">Fintech & Finance</option>
                      <option value="Media">Media & Marketing</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full h-[48px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-[48px] px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Company Website</label>
                      <span className="text-[10px] text-zinc-500 uppercase">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <HugeiconsIcon icon={Location01Icon} size={18} />
                      </div>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full h-[48px] pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#008744]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-3.5 h-[48px] rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteLater}
                    className="px-3.5 h-[48px] rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-white text-xs font-semibold"
                  >
                    Complete Later
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 h-[48px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <span>Continue</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FINISH */}
          {step === 3 && (
            <div className="text-center space-y-6 py-2">
              <div className="w-18 h-18 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} className="text-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  You&apos;re all set.
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-[360px] mx-auto">
                  {role === "worker"
                    ? "Your Earn profile is ready. Start exploring verified tasks and generating income."
                    : "Your Hire workspace is ready. Launch campaigns and recruit top digital talent across Africa."}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full h-[52px] rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Go to Dashboard</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </AuthCard>
      </div>
    </AuthLayout>
  );
}
