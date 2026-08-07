"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { ThemeLogo } from "@/components/brand/theme-logo";

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
    <div className="surface-shell relative flex min-h-screen flex-col justify-between overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      {/* Dotted Grid Overlay Accent */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--foreground) 28%, transparent) 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      <header className="relative z-10 w-full border-b border-white/[0.08] bg-[#050608] text-white backdrop-blur-[18px]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between px-6">
          <Link href="/" className="focus-ring group inline-block rounded-lg">
            <ThemeLogo
              forceDark
              className="h-[34px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            {showBackLink && (
              <Link
                href={backLinkHref}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white px-3.5 py-1.5 text-xs font-semibold transition-colors"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                <span>{backLinkLabel}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Center Container */}
      <main className="relative z-10 max-w-[440px] w-full mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1">
        {children}
      </main>

      {/* Bottom Footer Navigation — Permanently Dark */}
      <footer className="relative z-10 w-full border-t border-white/[0.08] bg-[#050608] py-6 text-center text-xs text-zinc-400">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} size={14} className="text-emerald-400" />
            <span>Bank-Grade Escrow Security & Encryption</span>
          </div>
          <p>© 2026 ZOLANZO LTD • A Stankings Company</p>
        </div>
      </footer>
    </div>
  );
}
