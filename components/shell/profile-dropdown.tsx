"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon, Settings01Icon, HelpCircleIcon, Logout01Icon } from "@hugeicons/core-free-icons";

interface ProfileDropdownProps {
  userName?: string;
  avatarUrl?: string;
  onClose?: () => void;
}

export function ProfileDropdown({
  userName = "Grace",
  avatarUrl = "/brand/lady1.png",
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    router.push("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
        aria-label="User Profile Menu"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-emerald-950 border border-emerald-500/20 relative">
          <Image src={avatarUrl} alt={userName} fill className="object-cover" />
        </div>
        <span className="text-xs font-bold text-white hidden sm:inline-block pr-2">{userName}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#131922] border border-white/[0.08] rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn text-xs space-y-1">
          <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
            <p className="font-bold text-white text-sm">{userName}</p>
            <p className="text-[11px] text-emerald-400 font-semibold">Active Earner</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <HugeiconsIcon icon={UserIcon} size={16} className="text-emerald-400" />
            <span>My Reputation</span>
          </Link>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <HugeiconsIcon icon={Settings01Icon} size={16} className="text-emerald-400" />
            <span>My Settings</span>
          </Link>

          <Link
            href="/support"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <HugeiconsIcon icon={HelpCircleIcon} size={16} className="text-teal-400" />
            <span>Help & Support</span>
          </Link>

          <div className="border-t border-zinc-800/80 pt-1 mt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer text-left font-semibold"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
