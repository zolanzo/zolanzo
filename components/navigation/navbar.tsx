"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeLogo } from "@/components/brand/theme-logo";
import { ThemeModeControl } from "@/components/theme/theme-toggle";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-header text-foreground backdrop-blur-[18px]">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-2 px-4 text-foreground md:h-[72px] lg:gap-6 lg:px-12">
        <Link href="/" className="flex h-8 min-w-0 shrink-0 items-center overflow-hidden lg:h-10">
          <ThemeLogo
            priority
            className="h-[34px] w-auto object-contain md:h-[32px] lg:h-[40px]"
          />
        </Link>

        <nav className="hidden shrink-0 items-center gap-2.5 text-[13px] font-medium text-foreground md:flex lg:gap-8 lg:text-[14px]">
          <Link href="/tasks" className="shrink-0 whitespace-nowrap transition-colors hover:text-primary">
            Find Work
          </Link>
          <Link href="/signup" className="shrink-0 whitespace-nowrap transition-colors hover:text-primary">
            Hire Talent
          </Link>
          <Link href="/#how-it-works" className="shrink-0 whitespace-nowrap transition-colors hover:text-primary">
            How It Works
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 lg:gap-3">
          <WhatsAppSupportLink
            variant="link"
            className="hidden min-h-0 h-9 px-1 md:inline-flex"
          />
          <ThemeModeControl variant="compact" />
          <Link
            href="/login"
            className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-3.5 text-[13px] font-bold text-primary-foreground transition-all hover:bg-primary-hover md:h-9 md:min-h-0 md:rounded-none md:bg-transparent md:px-2.5 md:font-semibold md:text-muted-foreground md:shadow-none md:hover:bg-transparent md:hover:text-foreground lg:h-[36px] lg:px-4 lg:text-[14px]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden h-9 items-center justify-center rounded-xl bg-primary px-3 text-[13px] font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover md:flex lg:h-[38px] lg:px-5 lg:text-[14px]"
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="focus-ring inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-foreground hover:text-primary md:hidden"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="space-y-4 border-b border-border bg-elevated px-5 py-6 text-foreground shadow-floating backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-3 text-[15px] font-medium text-foreground">
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center transition-colors hover:text-primary"
            >
              Find Work
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center transition-colors hover:text-primary"
            >
              Hire Talent
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center transition-colors hover:text-primary"
            >
              How It Works
            </Link>
            <WhatsAppSupportLink
              variant="link"
              className="justify-start px-0"
              onClick={() => setMobileMenuOpen(false)}
            />
          </nav>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-primary text-center text-sm font-bold text-primary-foreground shadow-md hover:bg-primary-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
