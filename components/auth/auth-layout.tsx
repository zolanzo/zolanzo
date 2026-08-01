"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";

interface AuthLayoutProps {
  children: React.ReactNode;
  showBackLink?: boolean;
  backLinkHref?: string;
  backLinkLabel?: string;
}

export function AuthLayout({
  children,
  showBackLink = false,
  backLinkHref = "/",
  backLinkLabel = "Back to home",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-[#008744] selection:text-white font-sans relative overflow-hidden">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-600/15 via-emerald-950/5 to-transparent pointer-events-none z-0" />

      {/* Grid Overlay Accent */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Header Navigation */}
      <header className="relative z-10 max-w-[1440px] w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="inline-block group focus-visible:outline-2 focus-visible:outline-[#008744] rounded-lg">
          <Image
            src="/brand/dark-theme-logo.webp"
            alt="ZOLANZO Logo"
            width={140}
            height={36}
            className="h-[34px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
            priority
          />
        </Link>

        {showBackLink && (
          <Link
            href={backLinkHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            <span>{backLinkLabel}</span>
          </Link>
        )}
      </header>

      {/* Main Form Center Container */}
      <main className="relative z-10 max-w-[440px] w-full mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1">
        {children}
      </main>

      {/* Bottom Footer Navigation */}
      <footer className="relative z-10 w-full py-6 text-center text-xs text-zinc-500 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} size={14} className="text-emerald-500" />
            <span>Bank-Grade Escrow Security & Encryption</span>
          </div>
          <p>© 2026 ZOLANZO LTD • A Stankings Company</p>
        </div>
      </footer>
    </div>
  );
}
