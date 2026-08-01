"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { GlobalSearchModal } from "@/components/shell/global-search-modal";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#000305] text-white flex flex-col lg:flex-row antialiased font-sans">
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Admin Header Bar */}
        <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-[#020507]/90 backdrop-blur-md sticky top-0 z-30 select-none">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <HugeiconsIcon icon={Search01Icon} size={14} />
              <span>Search everything (⌘K)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYSTEM ONLINE</span>
            </span>

            <div className="flex items-center gap-2 pl-3 border-l border-zinc-800 text-xs font-bold text-zinc-200">
              <HugeiconsIcon icon={Shield01Icon} size={16} className="text-red-400" />
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
