"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  CursorPointer01Icon,
  ClipboardListIcon,
  Wallet01Icon,
  Notification01Icon,
  HeadsetIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: "AI Model Image Labeling Campaign", category: "Opportunity (₦850)", href: "/tasks", icon: CursorPointer01Icon },
    { title: "Bank Disbursement Payout (₦18,400)", category: "Wallet Transaction", href: "/wallet", icon: Wallet01Icon },
    { title: "Fintech App UI Quality Inspection", category: "Application (In Progress)", href: "/applications", icon: ClipboardListIcon },
    { title: "How do I withdraw earnings to my bank?", category: "Help Center Article", href: "/support", icon: HeadsetIcon },
    { title: "Task Payout Approved (+₦850)", category: "Alert Notification", href: "/notifications", icon: Notification01Icon },
    { title: "Company & Workforce Profile", category: "Hirer Company Profile", href: "/hirer/company", icon: CursorPointer01Icon },
    { title: "Workforce Analytics & Escrow Spend", category: "Hirer Analytics", href: "/hirer/analytics", icon: Wallet01Icon },
    { title: "Staff Oversight & System Audits", category: "Super Admin Command", href: "/lex/auth", icon: CursorPointer01Icon },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter((l) => l.title.toLowerCase().includes(query.toLowerCase()) || l.category.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[560px] bg-[#131922] border border-white/[0.08] rounded-3xl p-5 shadow-2xl relative text-white space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5 flex-1 pr-4">
            <HugeiconsIcon icon={Search01Icon} size={20} className="text-[#008744]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunities, applications, transactions, help..."
              className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-zinc-500"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block px-2">
            Platform Index Search Results
          </span>

          {filteredLinks.length === 0 ? (
            <p className="text-xs text-zinc-500 p-4 text-center">No results found matching &quot;{query}&quot;.</p>
          ) : (
            filteredLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                onClick={onClose}
                className="p-3 rounded-2xl bg-[#0D1218] border border-white/[0.08] hover:border-emerald-500/40 transition-colors flex items-center justify-between text-xs group block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={link.icon} size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-emerald-400 transition-colors">{link.title}</p>
                    <p className="text-[10px] text-zinc-400">{link.category}</p>
                  </div>
                </div>

                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </Link>
            ))
          )}
        </div>

        <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Tip: Press <strong>ESC</strong> to close</span>
          <span className="text-emerald-400 font-semibold">Instant Platform Index</span>
        </div>

      </div>
    </div>
  );
}
