"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Icons } from "@/lib/icon-registry";

export function RoleSelector({ mode = "login" }: { mode?: "login" | "register" }) {
  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <BrandLogo width={160} height={40} priority />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to ZOLANZO
          </h1>
          <p className="text-xs text-zinc-400">
            Select your path to continue on the platform
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4 pt-2">
          {/* Earner Option */}
          <Link
            href={isLogin ? "/login" : "/signup"}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all text-left cursor-pointer min-h-[88px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 flex items-center justify-center shrink-0 transition-colors">
              <Icons.profile size={24} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="font-extrabold text-base text-white flex items-center justify-between">
                <span>Earner</span>
                <Icons.arrowRight size={18} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs text-zinc-400 font-normal">
                Find opportunities, complete tasks and earn money.
              </p>
            </div>
          </Link>

          {/* Hirer / Campaign Manager Option */}
          <Link
            href={isLogin ? "/login" : "/signup"}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/60 hover:bg-zinc-900 transition-all text-left cursor-pointer min-h-[88px]"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 flex items-center justify-center shrink-0 transition-colors">
              <Icons.organization size={24} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="font-extrabold text-base text-white flex items-center justify-between">
                <span>Hirer / Campaign Manager</span>
                <Icons.arrowRight size={18} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-xs text-zinc-400 font-normal">
                Create campaigns, hire earners and scale operations.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
