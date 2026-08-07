"use client";

import React, { useState, useMemo } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PhoneGateModal } from "@/components/auth/phone-gate-modal";
import { usePhoneGate } from "@/hooks/use-phone-gate";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useCapabilities } from "@/lib/capabilities-service";
import { ConnectAccountSheet } from "@/components/marketplace/connect-account-sheet";
import {
  SIMPLE_TASKS,
  LAUNCH_CATEGORIES,
  TaskDrawer,
  type SimpleTaskItem,
} from "@/components/marketplace/simple-task-drawer";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons";

export default function MobileTasksPage() {
  const { getTaskAccess } = useCapabilities();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [activeTask, setActiveTask] = useState<SimpleTaskItem | null>(null);

  // Connect Account In-Flow Sheet State
  const [connectSheetTarget, setConnectSheetTarget] = useState<SimpleTaskItem | null>(null);

  const { isOpen, actionName, triggerGate, handleVerified, handleClose } = usePhoneGate();

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return SIMPLE_TASKS.filter((t) => {
      const matchesSearch =
        search === "" ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.platform.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedPlatform !== "All" && t.platform.toLowerCase() !== selectedPlatform.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [search, selectedPlatform]);

  // Handle Task Tap / Start Execution
  const handleTaskAction = (task: SimpleTaskItem) => {
    const access = getTaskAccess(task.platform);

    if (access.isAccessible) {
      triggerGate(`Start "${task.name}"`, () => setActiveTask(task));
    } else if (access.status === "unavailable" || access.status === "rejected") {
      // Launch inline connect sheet immediately
      setConnectSheetTarget(task);
    }
  };

  return (
    <AppShell userName="Earner" avatarUrl="/brand/lady1.png">
      <PhoneGateModal
        isOpen={isOpen}
        actionName={actionName}
        onVerified={handleVerified}
        onClose={handleClose}
      />

      <TaskDrawer
        task={activeTask}
        isOpen={Boolean(activeTask)}
        onClose={() => setActiveTask(null)}
      />

      {/* IN-FLOW CONNECT ACCOUNT SHEET FOR SEAMLESS AUTOMATIC RETURN */}
      {connectSheetTarget && (
        <ConnectAccountSheet
          platform={connectSheetTarget.platform}
          readiness={getTaskAccess(connectSheetTarget.platform)}
          isOpen={Boolean(connectSheetTarget)}
          onClose={() => setConnectSheetTarget(null)}
          onSuccess={() => {
            const target = connectSheetTarget;
            setConnectSheetTarget(null);
            // Automatically launch task drawer without extra navigation
            triggerGate(`Start "${target.name}"`, () => setActiveTask(target));
          }}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-0 py-1">

        {/* EXPANDABLE SEARCH & PLATFORM CHIPS ROW */}
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full h-[40px] pl-3 pr-8 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-[40px] h-[40px] rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-colors"
              aria-label="Expand search"
            >
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </button>
          )}

          {/* HORIZONTAL PLATFORM CHIPS */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            <button
              type="button"
              onClick={() => setSelectedPlatform("All")}
              className={`h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedPlatform === "All"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              All
            </button>
            {LAUNCH_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedPlatform(cat)}
                className={`h-[38px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedPlatform === cat
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <SocialBrandIcon platform={cat} size={14} className="w-3.5 h-3.5 shrink-0" />
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOGO-DERIVED BRAND TASK CARDS WITH REAL-TIME TASK READINESS ENGINE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredTasks.map((t) => {
            const isHighPaying = t.rewardNumeric >= 50;
            const readiness = getTaskAccess(t.platform);

            return (
              <div
                key={t.id}
                onClick={() => handleTaskAction(t)}
                className="bg-white border border-slate-200/80 hover:border-emerald-500/40 rounded-[20px] p-4 h-[104px] flex items-center justify-between transition-all duration-200 shadow-soft hover:shadow-medium cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <SocialBrandIcon platform={t.platform} size={20} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">{t.name}</h3>
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} className="text-emerald-600 shrink-0" />
                    </div>
                    
                    {/* READINESS STATUS BADGE */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${readiness.badgeColorClass}`}>
                        {readiness.badgeText}
                      </span>
                    </div>

                    <span className={`text-xs font-black block mt-0.5 ${
                      isHighPaying ? "text-amber-600 font-extrabold" : "text-amber-600"
                    }`}>
                      {t.reward}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskAction(t);
                  }}
                  className={`h-[36px] px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${readiness.buttonColorClass}`}
                >
                  {readiness.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
