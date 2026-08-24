"use client";

import React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { ThemeLogo } from "@/components/brand/theme-logo";
import { ThemeModeControl } from "@/components/theme/theme-toggle";
import { APP_CONFIG } from "@/config/app";

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
    <div className="surface-shell relative flex h-dvh flex-col justify-between overflow-x-hidden overflow-y-auto font-sans selection:bg-primary selection:text-primary-foreground">
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

      <header className="relative z-10 w-full border-b border-border bg-header text-foreground backdrop-blur-[18px]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/" className="focus-ring group min-w-0 shrink rounded-lg">
            <ThemeLogo
              className="h-[30px] w-auto max-w-[42vw] object-contain object-left transition-transform group-hover:scale-[1.02] sm:h-[34px] sm:max-w-none"
              priority
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeModeControl variant="compact" />
            {showBackLink && (
              <Link
                href={backLinkHref}
                aria-label={backLinkLabel}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-hover sm:px-3.5"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                <span className="max-sm:sr-only">{backLinkLabel}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Form Center Container */}
      <main className="relative z-10 max-w-[440px] w-full mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1">
        {children}
      </main>

      <footer className="relative z-10 w-full border-t border-border bg-footer py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} size={14} className="text-primary" />
            <span>Bank-Grade Escrow Security & Encryption</span>
          </div>
          <p>© 2026 ZOLANZO LTD • A Stankings Company</p>
          <a
            href={APP_CONFIG.supportWhatsApp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            WhatsApp Support
          </a>
        </div>
      </footer>
    </div>
  );
}
