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
import { APP_CONFIG } from "@/config/app";

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
    { title: "Find work", category: "Tasks", href: "/tasks", icon: CursorPointer01Icon },
    { title: "Wallet", category: "Money", href: "/wallet", icon: Wallet01Icon },
    { title: "Applications", category: "Your work", href: "/applications", icon: ClipboardListIcon },
    { title: "Support", category: "Help", href: "/support", icon: HeadsetIcon },
    { title: "WhatsApp Support", category: "Help", href: APP_CONFIG.supportWhatsApp.href, icon: HeadsetIcon },
    { title: "Notifications", category: "Alerts", href: "/notifications", icon: Notification01Icon },
    { title: "Company", category: "Hirer", href: "/hirer/company", icon: CursorPointer01Icon },
    { title: "Results", category: "Hirer", href: "/hirer/analytics", icon: Wallet01Icon },
    { title: "Operations", category: "Admin", href: "/admin", icon: CursorPointer01Icon },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter((l) => l.title.toLowerCase().includes(query.toLowerCase()) || l.category.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-overlay backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-[560px] bg-elevated border border-border rounded-3xl p-5 shadow-2xl relative text-foreground space-y-4">
        
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5 flex-1 pr-4">
            <HugeiconsIcon icon={Search01Icon} size={20} className="text-primary" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunities, applications, transactions, help..."
              className="w-full bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block px-2">
            Platform Index Search Results
          </span>

          {filteredLinks.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">No results found matching &quot;{query}&quot;.</p>
          ) : (
            filteredLinks.map((link, i) => {
              const isExternal = link.href.startsWith("http");
              const className =
                "p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors flex items-center justify-between text-xs group block";
              const body = (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={link.icon} size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{link.title}</p>
                      <p className="text-[10px] text-muted-foreground">{link.category}</p>
                    </div>
                  </div>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </>
              );
              return isExternal ? (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className={className}
                >
                  {body}
                </a>
              ) : (
                <Link
                  key={i}
                  href={link.href}
                  onClick={onClose}
                  className={className}
                >
                  {body}
                </Link>
              );
            })
          )}
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Tip: Press <strong>ESC</strong> to close</span>
          <span className="text-primary font-semibold">Instant Platform Index</span>
        </div>

      </div>
    </div>
  );
}
