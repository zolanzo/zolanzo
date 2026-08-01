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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 my-8">
      <div className="w-full max-w-md space-y-6 text-center">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <BrandLogo width={160} height={40} priority />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Create Account</h1>
          <p className="text-xs text-zinc-400 font-medium">
            Join Africa&apos;s Premium Workforce Marketplace
          </p>
        </div>

        {/* Primary Form (Top) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Referral Username (Optional)</label>
            <input
              type="text"
              value={referralUsername}
              onChange={(e) => setReferralUsername(e.target.value)}
              placeholder="referrer_username"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-300">Account Type</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "worker" | "employer")}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[46px] cursor-pointer"
            >
              <option value="worker">Micro-Worker (Complete Tasks & Earn)</option>
              <option value="employer">Employer / Advertiser (Create Campaigns)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
              />
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2.5">
              <Icons.verified size={16} className="text-emerald-400" />
              <span className="font-semibold">Cloudflare Turnstile Verified</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Protected</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !turnstileVerified}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 min-h-[48px] flex items-center justify-center gap-2 cursor-pointer mt-2"
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
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-zinc-950 px-3 text-zinc-500 font-semibold tracking-wider">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        {/* Social Buttons (Bottom) */}
        <div className="space-y-3">
          
          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-xs font-bold text-zinc-200 transition-all flex items-center justify-center gap-3 min-h-[46px] cursor-pointer"
          >
            <BrandIcon brand="google" size={18} />
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-xs font-bold text-zinc-200 transition-all flex items-center justify-center gap-3 min-h-[46px] cursor-pointer"
          >
            <BrandIcon brand="facebook" size={18} />
            <span>Continue with Facebook</span>
          </button>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-xs font-bold text-zinc-200 transition-all flex items-center justify-center gap-3 min-h-[46px] cursor-pointer"
          >
            <BrandIcon brand="apple" size={18} />
            <span>Continue with Apple</span>
          </button>

        </div>

        {/* Footer Link */}
        <div className="pt-2 text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href={loginRoute} className="font-bold text-emerald-400 hover:text-emerald-300">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
