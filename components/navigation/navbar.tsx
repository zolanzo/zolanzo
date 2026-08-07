"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeLogo } from "@/components/brand/theme-logo";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#050608] backdrop-blur-[18px]">
      {/* DESKTOP NAVIGATION — Height 72px */}
      <div className="mx-auto hidden h-[72px] w-full max-w-[1440px] items-center justify-between px-8 text-white lg:px-12 md:flex">
        {/* Left: ZOLANZO Brand Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <ThemeLogo
            priority
            forceDark
            className="h-[40px] w-auto object-contain"
          />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-8 text-[14px] font-medium text-white">
          <Link href="/tasks" className="transition-colors hover:text-emerald-400">
            Find Work
          </Link>
          <Link href="/signup" className="transition-colors hover:text-emerald-400">
            Hire Talent
          </Link>
          <Link href="/tasks" className="transition-colors hover:text-emerald-400">
            Opportunities
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-emerald-400">
            How It Works
          </Link>
        </nav>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex h-[36px] items-center justify-center px-4 text-[14px] font-semibold text-zinc-300 transition-colors hover:text-white"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="flex h-[38px] items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 text-[14px] font-bold transition-all shadow-md"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* MOBILE NAVIGATION — Height 64px */}
      <div className="flex h-[64px] w-full items-center justify-between px-4 text-white md:hidden">
        {/* Left: ZOLANZO Brand Logo */}
        <Link href="/" className="flex items-center">
          <ThemeLogo
            priority
            forceDark
            className="h-[34px] w-auto object-contain"
          />
        </Link>

        {/* Right: Log in Button & Menu Icon */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="flex h-[34px] items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 text-[13px] font-bold transition-all"
          >
            Log in
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="focus-ring cursor-pointer rounded-lg p-1.5 text-white hover:text-emerald-400"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU */}
      {mobileMenuOpen && (
        <div className="space-y-4 border-b border-white/[0.08] bg-[#0A0F12] px-5 py-6 text-white shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-3 text-[15px] font-medium text-white">
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-emerald-400"
            >
              Find Work
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-emerald-400"
            >
              Hire Talent
            </Link>
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-emerald-400"
            >
              Opportunities
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 transition-colors hover:text-emerald-400"
            >
              How It Works
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5 border-t border-white/[0.08] pt-4">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-center text-sm font-bold shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
