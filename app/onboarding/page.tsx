"use client";

import React, { useEffect, useState } from "react";
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
  const [role, setRole] = useState<"worker" | "employer">("worker");
  const [roleReady, setRoleReady] = useState(false);
  const [country, setCountry] = useState("Nigeria");
  const [stateProv, setStateProv] = useState("Lagos");
  const [city, setCity] = useState("Lagos");
  const [language, setLanguage] = useState("English");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [website, setWebsite] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/onboarding");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && (data.data?.role === "employer" || data.data?.role === "worker")) {
          setRole(data.data.role);
        }
      } catch {
        // Keep the default worker view if the session profile cannot be read.
      } finally {
        if (!cancelled) setRoleReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      const destination =
        (data.data?.role === "employer" ? "employer" : role) === "employer"
          ? "/hirer/dashboard"
          : "/earner/dashboard";
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
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider text-primary">Step {step} of 3</span>
            <span>{Math.round((step / 3) * 100)}% Complete</span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full border border-border bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <AuthCard>
          <ValidationMessage message={error} />

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center space-y-6 py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle text-primary shadow-soft">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} className="text-primary" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Welcome to ZOLANZO
                </h1>
                <p className="mx-auto max-w-[380px] text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Let&apos;s get everything ready in just a minute.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="primary-action flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold"
                >
                  <span>Continue</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </button>

                <Link
                  href="/"
                  className="secondary-action flex h-[48px] w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold"
                >
                  <span>Back Home</span>
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: COMPLETE PROFILE (DYNAMIC BASED ON STORED ROLE) */}
          {step === 2 && (
            <div className="space-y-4 py-1 text-left">
              {!roleReady ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading your account…</p>
              ) : (
              <>
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Complete Profile</h2>
                <p className="text-xs text-muted-foreground">
                  {role === "worker" ? "Set your location & language preferences for Earn opportunities." : "Tell us about your organization for Hire campaigns."}
                </p>
              </div>

              {role === "worker" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Country</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <HugeiconsIcon icon={Globe02Icon} size={18} />
                      </div>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
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
                      <label className="text-xs font-semibold text-foreground">State / Province</label>
                      <input
                        type="text"
                        value={stateProv}
                        onChange={(e) => setStateProv(e.target.value)}
                        placeholder="e.g. Lagos"
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Ikeja"
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Preferred Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="h-[48px] w-full rounded-xl border border-border bg-input-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
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
                      <label className="text-xs font-semibold text-foreground">Company Name</label>
                      <span className="text-[10px] uppercase text-muted-foreground">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <HugeiconsIcon icon={Building01Icon} size={18} />
                      </div>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Stankings Technologies"
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="h-[48px] w-full rounded-xl border border-border bg-input-background px-3.5 text-sm text-foreground focus:border-primary focus:outline-none"
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
                      <label className="text-xs font-semibold text-foreground">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs font-semibold text-foreground">Company Website</label>
                      <span className="text-[10px] uppercase text-muted-foreground">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <HugeiconsIcon icon={Location01Icon} size={18} />
                      </div>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="h-[48px] w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-sm text-foreground focus:border-primary focus:outline-none"
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
                    className="flex h-[48px] items-center gap-1.5 rounded-xl border border-border px-3.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteLater}
                    className="h-[48px] rounded-xl border border-border bg-muted px-3.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    Complete Later
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="primary-action flex h-[48px] items-center gap-1.5 rounded-xl px-6 text-xs font-bold"
                >
                  <span>Continue</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
              </>
              )}
            </div>
          )}

          {/* STEP 3: FINISH */}
          {step === 3 && (
            <div className="text-center space-y-6 py-2">
              <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full border border-primary/20 bg-primary-subtle text-primary shadow-soft">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} className="animate-pulse text-primary" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  You&apos;re all set.
                </h2>
                <p className="mx-auto max-w-[360px] text-xs leading-relaxed text-muted-foreground sm:text-sm">
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
                  className="primary-action flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
