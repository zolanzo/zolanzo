"use client";

import React, { useMemo, useState } from "react";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { OpportunityCard } from "@/components/marketplace/opportunity-card";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { inferSocialPlatform } from "@/lib/platforms/infer";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";
import type { WorkOpportunity } from "@/features/task-marketplace/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

const PLATFORM_FILTERS = [
  "All",
  "TikTok",
  "Instagram",
  "Facebook",
  "YouTube",
  "WhatsApp",
  "Telegram",
  "Threads",
  "X",
  "LinkedIn",
  "Website",
  "GooglePlay",
] as const;

export function TasksBrowseView({ workspace }: { workspace: EarnerWorkspace }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORM_FILTERS)[number]>("All");
  const live = isLiveBoundary(workspace.loadState);

  const filtered = useMemo(() => {
    return workspace.opportunities.filter((item) => {
      const inferred = inferSocialPlatform(item.category, item.title, item.templateName);
      const matchesPlatform = platform === "All" || inferred === platform;
      const hay = `${item.title} ${item.category} ${item.templateName}`.toLowerCase();
      const matchesSearch = search.trim() === "" || hay.includes(search.toLowerCase());
      return matchesPlatform && matchesSearch;
    });
  }, [workspace.opportunities, platform, search]);

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-4xl mx-auto space-y-2.5 px-4 sm:px-0 pb-4">
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative flex-1 min-w-0">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
                className="w-full h-10 pl-3 pr-8 rounded-xl bg-card border border-border text-xs text-foreground"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearch("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Close search"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground shrink-0"
              aria-label="Search tasks"
            >
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </button>
          )}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {PLATFORM_FILTERS.map((cat) => {
              const selected = platform === cat;
              const label = cat === "GooglePlay" ? "Play" : cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPlatform(cat)}
                  aria-pressed={selected}
                  aria-label={label}
                  className={`h-10 min-w-10 px-2.5 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {cat !== "All" ? <SocialBrandIcon platform={cat} size={16} /> : null}
                  {cat === "All" ? (
                    "All"
                  ) : (
                    <span className="hidden sm:inline">{label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            type="tasks"
            title={live ? "No tasks yet" : "No tasks available"}
            description={
              live
                ? "When campaigns go live they will appear here."
                : "Task listings load when the marketplace is reachable."
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((item: WorkOpportunity) => (
              <OpportunityCard key={item.instanceId} opportunity={item} />
            ))}
          </div>
        )}
      </div>
    </WorkspaceAppShell>
  );
}
