"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Cancel01Icon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
import {
  getImpersonationSession,
  exitImpersonation,
  logImpersonatedAction,
  type ImpersonationSession,
} from "@/lib/auth/impersonation";

export function ImpersonationBanner() {
  const [session, setSession] = useState<ImpersonationSession | null>(getImpersonationSession);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const active = getImpersonationSession();
    if (active && active.isActive) {
      logImpersonatedAction(
        "PAGE_VIEW",
        pathname,
        `Navigated to page: ${pathname}`
      );
    }
  }, [pathname]);

  if (!session || !session.isActive) return null;

  const handleExit = () => {
    exitImpersonation();
    setSession(null);
    router.push("/lex/auth");
  };

  return (
    <div className="sticky top-0 z-50 bg-[#854d0e] border-b border-amber-400/40 text-white px-4 py-2.5 shadow-2xl animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-400/30 text-amber-300 font-black tracking-wide">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="animate-pulse text-amber-400" />
            <span>SUPER ADMIN IMPERSONATION ACTIVE</span>
          </div>

          <div className="flex items-center gap-2 font-medium text-zinc-100">
            <span>You are impersonating:</span>
            <span className="font-bold text-white bg-black/40 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
              <HugeiconsIcon icon={UserCheck01Icon} size={14} className="text-emerald-400" />
              {session.targetName} ({session.targetEmail})
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-bold text-[11px] border border-blue-400/30">
              Role: {session.targetRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] text-amber-200/80 italic hidden md:inline">
            Reason: &ldquo;{session.reason}&rdquo;
          </span>

          <button
            type="button"
            onClick={handleExit}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ring-2 ring-red-400/50"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} />
            <span>Exit Impersonation Instantly</span>
          </button>
        </div>
      </div>
    </div>
  );
}
