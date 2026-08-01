"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BrandIcon } from "@/components/ui/brand-icons";
import { Icons } from "@/lib/icon-registry";

export function LoginForm({
  portalType,
}: {
  portalType: "worker" | "employer";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isWorker = portalType === "worker";
  const registerRoute = isWorker ? "/register/worker" : "/register/employer";
  const forgotRoute = isWorker ? "/forgot-password/worker" : "/forgot-password/employer";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      window.location.href = isWorker ? "/worker/dashboard" : "/organization/dashboard";
    }, 600);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <BrandLogo width={160} height={40} priority />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome Back</h1>
          <p className="text-xs text-zinc-400 font-medium">
            Sign in to your ZOLANZO account
          </p>
        </div>

        {/* Primary Form (Top) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-300">Password</label>
              <Link href={forgotRoute} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 min-h-[46px]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 min-h-[48px] flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <Icons.refresh className="animate-spin size-4" />
            ) : (
              <>Sign In <Icons.arrowRight size={16} /></>
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
          Don&apos;t have an account?{" "}
          <Link href={registerRoute} className="font-bold text-emerald-400 hover:text-emerald-300">
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}
