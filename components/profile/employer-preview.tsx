"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { UserAvatar } from "@/components/identity/user-avatar";
import { PREFERENCE_PLATFORMS } from "@/features/settings/constants";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";

type EmployerPreviewProps = {
  workspace: Pick<
    EarnerWorkspace,
    | "displayName"
    | "avatarUrl"
    | "trustScore"
    | "stats"
    | "verification"
    | "memberSince"
    | "preferences"
  >;
  onClose: () => void;
};

function rateLabel(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function EmployerPreview({ workspace, onClose }: EmployerPreviewProps) {
  const memberYear = new Date(workspace.memberSince).getFullYear();
  const platforms = workspace.preferences.preferredPlatforms;

  return (
    <div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employer-preview-title"
        className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4 space-y-3 shadow-floating"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              name={workspace.displayName}
              src={workspace.avatarUrl}
              size={48}
              className="rounded-2xl"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 id="employer-preview-title" className="text-sm font-black text-foreground truncate">
                  {workspace.displayName}
                </h3>
                {workspace.verification.email && workspace.verification.phone ? (
                  <HugeiconsIcon
                    icon={CheckmarkBadge01Icon}
                    size={16}
                    className="text-primary shrink-0"
                  />
                ) : null}
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">Professional identity</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-2"
            aria-label="Close employer preview"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Trust score" value={workspace.trustScore != null ? `${workspace.trustScore}` : "—"} />
          <Metric label="Approval rate" value={rateLabel(workspace.stats.approvalRate)} />
          <Metric label="Completion" value={rateLabel(workspace.stats.completionRate)} />
          <Metric label="Member since" value={String(memberYear)} />
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Verification
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Flag ok={workspace.verification.identity} label="Identity" />
            <Flag ok={workspace.verification.phone} label="Phone" />
            <Flag ok={workspace.verification.email} label="Email" />
            <Flag ok={workspace.verification.bank} label="Bank" />
          </div>
        </div>

        {platforms.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Capabilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((key) => {
                const meta = PREFERENCE_PLATFORMS.find((p) => p.key === key);
                return (
                  <span
                    key={key}
                    className="h-7 px-2 rounded-lg border border-border bg-muted flex items-center gap-1.5 text-[11px] font-bold text-foreground"
                  >
                    <SocialBrandIcon platform={key} size={14} />
                    {meta?.label ?? key}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="text-[11px] text-foreground leading-relaxed">
          Employers see professional reputation only. Bank numbers, NIN, and earnings history stay private.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted border border-border">
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{label}</span>
      <span className="text-sm font-black text-foreground mt-0.5 block">{value}</span>
    </div>
  );
}

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${
        ok
          ? "bg-primary-subtle text-primary border-primary/25"
          : "bg-muted text-foreground border-border"
      }`}
    >
      {ok ? "✓" : "–"} {label}
    </span>
  );
}
