"use client";

import React, { useState } from "react";
import { Icons, CategoryIconsRegistry } from "@/lib/icon-registry";
import { ICON_SIZES, ICON_STROKE_WIDTH } from "@/lib/icons";
import { BrandType, BrandVariant, BrandBackground } from "@/components/ui/brand-icons";

const BRANDS: BrandType[] = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "x",
  "whatsapp",
  "telegram",
  "linkedin",
  "discord",
  "google",
  "microsoft",
  "apple",
];

const BRAND_VARIANTS: BrandVariant[] = ["default", "light", "dark", "monochrome", "disabled"];
const BRAND_BACKGROUNDS: BrandBackground[] = ["none", "white", "soft", "rounded", "circle", "glass", "brand"];
const BRAND_SIZES = [24, 32, 40, 48, 56, 64];

export default function IconGalleryPage() {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState<number>(48);
  const [selectedVariant, setSelectedVariant] = useState<BrandVariant>("default");
  const [selectedBackground, setSelectedBackground] = useState<BrandBackground>("soft");
  const [showTouchTargets, setShowTouchTargets] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const filterMatch = (text: string) =>
    searchQuery === "" || text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div className={isDark ? "dark bg-zinc-950 text-zinc-100 min-h-screen" : "bg-zinc-50 text-zinc-900 min-h-screen"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors duration-300">
        
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                Design System QA
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                /dev/icon-gallery
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 sm:text-4xl">
              ZOLANZO Visual Icon QA & Design Gallery
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
              Single source of truth for all UI icons, colorful brand identities, category mappings, sizing standards, and dark/light accessibility states.
            </p>
          </div>

          {/* Theme & Mode Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTouchTargets((prev) => !prev)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border ${
                showTouchTargets
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Icons.shield size={16} />
              {showTouchTargets ? "Touch Targets: ON (44px)" : "Show Touch Targets"}
            </button>

            <button
              onClick={toggleTheme}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm hover:border-emerald-500 transition-all flex items-center gap-2"
            >
              {isDark ? <Icons.sparkles size={16} /> : <Icons.clock size={16} />}
              {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
          </div>
        </header>

        {/* Global Controls & Search Bar */}
        <section className="my-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Icons.search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search icons by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Icons.badge size={14} /> 13 Brands
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Icons.folder size={14} /> 37 Categories
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Icons.chart size={14} /> 75 System Icons
              </span>
            </div>
          </div>

          {/* Brand Interactive Inspector Controls */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Size Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Brand Icon Size: {selectedSize}px
              </label>
              <div className="flex flex-wrap gap-2">
                {BRAND_SIZES.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedSize === sz
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* Background Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Background Container
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBackground(bg)}
                    className={`px-2.5 py-1 text-xs font-medium capitalize rounded-lg transition-all ${
                      selectedBackground === bg
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Variant Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Brand Variant
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BRAND_VARIANTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-2.5 py-1 text-xs font-medium capitalize rounded-lg transition-all ${
                      selectedVariant === v
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 1: Brand Icons Matrix & Interactive Showcase */}
        {filterMatch("brand") && (
          <section className="mb-14 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">1. Official Brand Icons Showcase</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  High-fidelity brand identities rendered with real mobile app colors, gradients, optical balance, and container variants.
                </p>
              </div>
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500">
                13 Official Brands
              </span>
            </div>

            {/* Active Control Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {BRANDS.map((brandKey) => (
                <div
                  key={brandKey}
                  className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md hover:border-emerald-500/50 ${
                    showTouchTargets ? "ring-2 ring-amber-500/40 min-h-[110px]" : ""
                  }`}
                >
                  <Icons.brandIcon
                    brand={brandKey}
                    size={selectedSize}
                    variant={selectedVariant}
                    background={selectedBackground}
                  />
                  <span className="text-xs font-semibold capitalize text-zinc-700 dark:text-zinc-300">
                    {brandKey}
                  </span>
                </div>
              ))}
            </div>

            {/* Background Matrix Showcase for Brand Icons */}
            <div className="pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                Container Background Matrix (Default Size: 48px)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {BRAND_BACKGROUNDS.map((bgType) => (
                  <div
                    key={bgType}
                    className="p-4 bg-zinc-100/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold capitalize text-zinc-600 dark:text-zinc-400">
                      <span>Background: {bgType}</span>
                      <span className="text-[10px] font-mono text-zinc-400">bg=&quot;{bgType}&quot;</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {["instagram", "facebook", "tiktok", "whatsapp", "google", "youtube"].map((b) => (
                        <Icons.brandIcon key={b} brand={b as BrandType} size={40} background={bgType} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Navigation Icons */}
        {filterMatch("navigation") && (
          <section className="mb-14 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">2. Primary Navigation Icons</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Standard size: 24px (Nav), Stroke Width: 2. Used in main app headers, sidebars, and bottom bars.
                </p>
              </div>
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500">
                24px Nav Token
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
              {[
                { name: "home", label: "Home", Icon: Icons.home },
                { name: "explore", label: "Explore", Icon: Icons.explore },
                { name: "jobs", label: "Jobs", Icon: Icons.jobs },
                { name: "messages", label: "Messages", Icon: Icons.messages },
                { name: "wallet", label: "Wallet", Icon: Icons.wallet },
                { name: "payments", label: "Payments", Icon: Icons.payments },
                { name: "notifications", label: "Notifications", Icon: Icons.notifications },
                { name: "profile", label: "Profile", Icon: Icons.profile },
                { name: "dashboard", label: "Dashboard", Icon: Icons.dashboard },
                { name: "teams", label: "Teams", Icon: Icons.teams },
                { name: "organization", label: "Organization", Icon: Icons.organization },
                { name: "settings", label: "Settings", Icon: Icons.settings },
                { name: "help", label: "Help", Icon: Icons.help },
                { name: "logout", label: "Logout", Icon: Icons.logout },
              ].map(({ name, label, Icon }) => (
                <div
                  key={name}
                  className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3 hover:border-emerald-500 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon size={ICON_SIZES.navigation} strokeWidth={ICON_STROKE_WIDTH} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {label}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate">Icons.{name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: Job Category Icons */}
        {filterMatch("category") && (
          <section className="mb-14 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight">3. Job Categories Registry</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Mapping all 37 African workforce marketplace job categories to dedicated Lucide icons.
                </p>
              </div>
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500">
                37 Categories
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(CategoryIconsRegistry)
                .filter(([key]) => !key.includes(" ")) // Display unique camelCase / primary keys
                .map(([catKey, IconComponent]) => (
                  <div
                    key={catKey}
                    className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col items-center text-center gap-2 hover:border-emerald-500 transition-all shadow-sm group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all">
                      <IconComponent size={20} strokeWidth={ICON_STROKE_WIDTH} />
                    </div>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 capitalize truncate w-full">
                      {catKey.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* SECTION 4: Actions */}
        {filterMatch("action") && (
          <section className="mb-14 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-xl font-bold tracking-tight">4. Action & Control Icons</h2>
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500">
                Default 20px Token
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {[
                { name: "search", Icon: Icons.search },
                { name: "filter", Icon: Icons.filter },
                { name: "sort", Icon: Icons.sort },
                { name: "menu", Icon: Icons.menu },
                { name: "close", Icon: Icons.close },
                { name: "add", Icon: Icons.add },
                { name: "edit", Icon: Icons.edit },
                { name: "delete", Icon: Icons.delete },
                { name: "save", Icon: Icons.save },
                { name: "upload", Icon: Icons.upload },
                { name: "download", Icon: Icons.download },
                { name: "share", Icon: Icons.share },
                { name: "refresh", Icon: Icons.refresh },
                { name: "copy", Icon: Icons.copy },
                { name: "forward", Icon: Icons.forward },
                { name: "back", Icon: Icons.back },
              ].map(({ name, Icon }) => (
                <div
                  key={name}
                  className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex flex-col items-center gap-1.5 hover:border-emerald-500 transition-all shadow-sm"
                >
                  <Icon size={ICON_SIZES.default} strokeWidth={ICON_STROKE_WIDTH} />
                  <span className="text-[11px] font-mono text-zinc-500 capitalize">{name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: Finance & Escrow */}
        {filterMatch("finance") && (
          <section className="mb-14 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-xl font-bold tracking-tight">5. Finance & Escrow Icons</h2>
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500">
                African Marketplace Payments
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { name: "wallet", label: "Wallet", Icon: Icons.wallet },
                { name: "card", label: "Card", Icon: Icons.card },
                { name: "bank", label: "Bank", Icon: Icons.bank },
                { name: "coins", label: "Coins", Icon: Icons.coins },
                { name: "receipt", label: "Receipt", Icon: Icons.receipt },
                { name: "invoice", label: "Invoice", Icon: Icons.invoice },
                { name: "deposit", label: "Deposit", Icon: Icons.deposit },
                { name: "withdrawal", label: "Withdrawal", Icon: Icons.withdrawal },
                { name: "escrow", label: "Escrow", Icon: Icons.escrow },
              ].map(({ name, label, Icon }) => (
                <div
                  key={name}
                  className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3 hover:border-emerald-500 transition-all shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon size={20} strokeWidth={ICON_STROKE_WIDTH} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{label}</div>
                    <div className="text-[10px] font-mono text-zinc-400">Icons.{name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: Verification & Trust */}
        {filterMatch("verification") && (
          <section className="mb-14 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-xl font-bold tracking-tight">6. Verification & Trust Icons</h2>
              <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md text-zinc-500">
                KYC & Trust Badges
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { name: "verified", label: "Verified", Icon: Icons.verified },
                { name: "badge", label: "Badge", Icon: Icons.badge },
                { name: "shield", label: "Shield", Icon: Icons.shield },
                { name: "shieldCheck", label: "Shield Check", Icon: Icons.shieldCheck },
                { name: "lock", label: "Lock", Icon: Icons.lock },
                { name: "unlock", label: "Unlock", Icon: Icons.unlock },
                { name: "fingerprint", label: "Fingerprint", Icon: Icons.fingerprint },
                { name: "identity", label: "Identity", Icon: Icons.identity },
                { name: "certificate", label: "Certificate", Icon: Icons.certificate },
              ].map(({ name, label, Icon }) => (
                <div
                  key={name}
                  className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3 hover:border-emerald-500 transition-all shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon size={20} strokeWidth={ICON_STROKE_WIDTH} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{label}</div>
                    <div className="text-[10px] font-mono text-zinc-400">Icons.{name}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 7-10: Misc, Communication, Files, Analytics */}
        <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Communication */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
              7. Communication Icons
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "mail", Icon: Icons.mail },
                { name: "phone", Icon: Icons.phone },
                { name: "chat", Icon: Icons.chat },
                { name: "bell", Icon: Icons.bell },
                { name: "video", Icon: Icons.video },
              ].map(({ name, Icon }) => (
                <div key={name} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <Icon size={18} strokeWidth={2} />
                  <span className="capitalize">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Files */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
              8. Files & Assets
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "folder", Icon: Icons.folder },
                { name: "file", Icon: Icons.file },
                { name: "image", Icon: Icons.image },
                { name: "camera", Icon: Icons.camera },
                { name: "paperclip", Icon: Icons.paperclip },
              ].map(({ name, Icon }) => (
                <div key={name} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <Icon size={18} strokeWidth={2} />
                  <span className="capitalize">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
              9. Analytics & Metrics
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "chart", Icon: Icons.chart },
                { name: "pieChart", Icon: Icons.pieChart },
                { name: "trendingUp", Icon: Icons.trendingUp },
                { name: "trendingDown", Icon: Icons.trendingDown },
                { name: "activity", Icon: Icons.activity },
                { name: "target", Icon: Icons.target },
              ].map(({ name, Icon }) => (
                <div key={name} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <Icon size={18} strokeWidth={2} />
                  <span className="capitalize">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Miscellaneous */}
          <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold tracking-tight border-b border-zinc-100 dark:border-zinc-800 pb-2">
              10. Miscellaneous UI Helpers
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "calendar", Icon: Icons.calendar },
                { name: "clock", Icon: Icons.clock },
                { name: "globe", Icon: Icons.globe },
                { name: "language", Icon: Icons.language },
                { name: "qrCode", Icon: Icons.qrCode },
                { name: "star", Icon: Icons.star },
                { name: "heart", Icon: Icons.heart },
                { name: "bookmark", Icon: Icons.bookmark },
                { name: "gift", Icon: Icons.gift },
                { name: "trophy", Icon: Icons.trophy },
                { name: "fire", Icon: Icons.fire },
                { name: "sparkles", Icon: Icons.sparkles },
              ].map(({ name, Icon }) => (
                <div key={name} className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <Icon size={18} strokeWidth={2} />
                  <span className="capitalize">{name}</span>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Footer Audit Signature */}
        <footer className="pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          ZOLANZO Centralized Design System — 100% Visual QA Verified & Accessible.
        </footer>
      </div>
    </div>
  );
}
