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
  const [session, setSession] = useState<ImpersonationSession | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setSession(getImpersonationSession());
  }, []);

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
    <div className="sticky top-0 z-50 border-b border-warning/40 bg-warning px-4 py-2.5 text-warning-foreground shadow-floating animate-fadeIn">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-lg border border-warning-foreground/30 bg-warning-foreground/10 px-2.5 py-1 font-black tracking-wide text-warning-foreground">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="animate-pulse text-warning-foreground" />
            <span>SUPER ADMIN IMPERSONATION ACTIVE</span>
          </div>

          <div className="flex items-center gap-2 font-medium text-warning-foreground">
            <span>You are impersonating:</span>
            <span className="flex items-center gap-1 rounded-md border border-warning-foreground/20 bg-warning-foreground/10 px-2 py-0.5 font-bold text-warning-foreground">
              <HugeiconsIcon icon={UserCheck01Icon} size={14} className="text-primary-foreground" />
              {session.targetName} ({session.targetEmail})
            </span>
            <span className="px-2 py-0.5 rounded bg-info/20 text-info-foreground font-bold text-[11px] border border-info/30">
              Role: {session.targetRole}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-[11px] text-warning-foreground/80 italic hidden md:inline">
            Reason: &ldquo;{session.reason}&rdquo;
          </span>

          <button
            type="button"
            onClick={handleExit}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-danger px-3.5 py-1.5 text-xs font-black text-danger-foreground shadow-lg ring-2 ring-danger/40 transition-all hover:bg-danger/90"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={15} />
            <span>Exit Impersonation Instantly</span>
          </button>
        </div>
      </div>
    </div>
  );
}
