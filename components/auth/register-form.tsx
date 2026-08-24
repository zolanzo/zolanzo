"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BrandIcon } from "@/components/ui/brand-icons";
import { Icons } from "@/lib/icon-registry";

export function RegisterForm({
  portalType = "worker",
}: {
  portalType?: "worker" | "employer";
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [referralUsername, setReferralUsername] = useState("");
  const [accountType, setAccountType] = useState<"worker" | "employer">(portalType);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileVerified] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const isWorker = accountType === "worker";
  const loginRoute = isWorker ? "/login/worker" : "/login/employer";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = isWorker ? "/worker/dashboard" : "/organization/dashboard";
    }, 600);
  };

  return (
    <div className="my-8 flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground sm:p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <BrandLogo width={160} height={40} priority />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-xs font-medium text-muted-foreground">
            Join Africa&apos;s Premium Workforce Marketplace
          </p>
        </div>

        {/* Primary Form (Top) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-3.5 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-3.5 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Referral Username (Optional)</label>
            <input
              type="text"
              value={referralUsername}
              onChange={(e) => setReferralUsername(e.target.value)}
              placeholder="referrer_username"
              className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "worker" | "employer")}
              className="min-h-[46px] w-full cursor-pointer rounded-xl border border-border bg-input-background px-4 py-3 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="worker">Earner (Complete Tasks & Earn)</option>
              <option value="employer">Hirer / Campaign Manager (Create Campaigns)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-3.5 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-[46px] w-full rounded-xl border border-border bg-input-background px-3.5 py-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-3.5 text-xs text-foreground">
            <div className="flex items-center gap-2.5">
              <Icons.verified size={16} className="text-primary" />
              <span className="font-semibold">Cloudflare Turnstile Verified</span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">Protected</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !turnstileVerified}
            className="primary-action mt-2 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-xs font-bold"
          >
            {isLoading ? (
              <Icons.refresh className="animate-spin size-4" />
            ) : (
              <>Create Account <Icons.arrowRight size={16} /></>
            )}
          </button>

        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-background px-3 font-semibold tracking-wider text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        {/* Social Buttons (Bottom) */}
        <div className="space-y-3">
          
          <button
            type="button"
            className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-hover"
          >
            <BrandIcon brand="google" size={18} />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-hover"
          >
            <BrandIcon brand="facebook" size={18} />
            <span>Continue with Facebook</span>
          </button>

          <button
            type="button"
            className="flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-hover"
          >
            <BrandIcon brand="apple" size={18} />
            <span>Continue with Apple</span>
          </button>

        </div>

        {/* Footer Link */}
        <div className="pt-2 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href={loginRoute} className="font-bold text-primary hover:text-primary-hover">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
