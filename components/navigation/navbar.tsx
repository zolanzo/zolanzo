"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full relative z-50">
      {/* DESKTOP NAVIGATION — Permanently dark header (#04090B), height 72px */}
      <div className="hidden md:flex bg-[#04090B] text-white items-center justify-between px-8 lg:px-12 h-[72px] w-full border-b border-white/10">
        {/* Left: ZOLANZO Brand Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/brand/dark-theme-logo.webp"
            alt="ZOLANZO Logo"
            width={155}
            height={40}
            priority
            className="h-[40px] w-auto object-contain"
          />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="flex items-center gap-8 text-[14px] font-medium text-white">
          <Link href="/tasks" className="hover:text-emerald-400 transition-colors">
            Find Work
          </Link>
          <Link href="/signup" className="hover:text-emerald-400 transition-colors">
            Hire Talent
          </Link>
          <Link href="/tasks" className="hover:text-emerald-400 transition-colors">
            Marketplace
          </Link>
          <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">
            How It Works
          </Link>
        </nav>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 text-[14px] font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center h-[36px]"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="px-4 text-[14px] font-semibold text-white rounded-[8px] bg-[#008744] hover:bg-[#00753b] transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center h-[38px]"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* MOBILE NAVIGATION — Identical dark header (#04090B), height 64px */}
      <div className="md:hidden bg-[#04090B] text-white flex items-center justify-between px-4 h-[64px] w-full border-b border-white/10">
        {/* Left: ZOLANZO Brand Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/dark-theme-logo.webp"
            alt="ZOLANZO Logo"
            width={130}
            height={34}
            priority
            className="h-[34px] w-auto object-contain"
          />
        </Link>

        {/* Right: Green Log in Button & Hamburger Menu Icon */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-3 text-[13px] font-semibold text-white rounded-[6px] bg-[#008744] hover:bg-[#00753b] transition-colors flex items-center justify-center h-[32px]"
          >
            Log in
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-white hover:text-zinc-300 focus:outline-none cursor-pointer"
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
        <div className="md:hidden bg-[#04090B] text-white border-b border-white/10 px-5 py-6 space-y-4 shadow-lg">
          <nav className="flex flex-col space-y-3 text-[15px] font-medium text-zinc-100">
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400 transition-colors"
            >
              Find Work
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400 transition-colors"
            >
              Hire Talent
            </Link>
            <Link
              href="/tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-400 transition-colors"
            >
              How It Works
            </Link>
          </nav>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-semibold text-white bg-[#008744] rounded-[8px] hover:bg-[#00753b] transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2 text-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Log in to existing account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
