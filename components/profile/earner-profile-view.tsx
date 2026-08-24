"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { UserAvatar } from "@/components/identity/user-avatar";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { EmployerPreview } from "@/components/profile/employer-preview";
import { connectionCopy, useCapabilities } from "@/lib/capabilities-service";
import { useToast } from "@/providers/toast-provider";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Copy01Icon, Settings01Icon, UserIcon } from "@hugeicons/core-free-icons";

export function EarnerProfileView({ workspace }: { workspace: EarnerWorkspace }) {
  const { platforms, capabilities } = useCapabilities();
  const { toast } = useToast();
  const [employerOpen, setEmployerOpen] = useState(false);
  const live = isLiveBoundary(workspace.loadState);
  const memberLabel =
    live && workspace.memberSince
      ? new Date(workspace.memberSince).toLocaleDateString("en-NG", {
          month: "long",
          year: "numeric",
        })
      : null;

  const copyId = async () => {
    if (!workspace.workerPublicId) return;
    await navigator.clipboard.writeText(workspace.workerPublicId);
    toast({ title: "Worker ID copied", variant: "success" });
  };

  const healthItems = [
    { label: "Email", done: workspace.verification.email, href: "/verify-email" },
    { label: "Phone", done: workspace.verification.phone, href: "/verify-phone" },
    { label: "Bank", done: workspace.verification.bank, href: "/wallet" },
    { label: "Identity", done: workspace.verification.identity, href: "/settings" },
  ];
  const readyCapabilities = capabilities.filter((cap) => cap.status === "ready");

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <section className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              name={workspace.displayName}
              src={workspace.avatarUrl}
              size={52}
              className="rounded-2xl"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-foreground truncate">
                  {live ? workspace.displayName || "Account" : "Account"}
                </h1>
                {workspace.verification.email ? (
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-primary shrink-0" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {live && workspace.handle ? `@${workspace.handle}` : "Profile loads after sign-in"}
                {memberLabel ? (
                  <>
                    <span className="text-muted-foreground px-1">·</span>
                    Since {memberLabel}
                  </>
                ) : null}
              </p>
              {workspace.workerPublicId ? (
                <button
                  type="button"
                  onClick={() => void copyId()}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md"
                >
                  {workspace.workerPublicId}
                  <HugeiconsIcon icon={Copy01Icon} size={12} />
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {live ? (
              <button
                type="button"
                onClick={() => setEmployerOpen(true)}
                className="h-9 px-3 rounded-xl bg-foreground text-background text-xs font-bold hidden sm:inline-flex items-center gap-1.5"
              >
                <HugeiconsIcon icon={UserIcon} size={14} />
                Employer view
              </button>
            ) : null}
            <Link
              href="/settings"
              className="h-9 px-3 rounded-xl bg-muted text-foreground text-xs font-bold inline-flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={Settings01Icon} size={14} />
              Account
            </Link>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Earning Passport
            </h2>
            {workspace.trustScore != null ? (
              <span className="text-xs font-black text-primary">Trust {workspace.trustScore}</span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Completed" value={live ? String(workspace.stats.completedAssignments) : "—"} />
            <Stat
              label="Approval"
              value={
                !live || workspace.stats.approvalRate == null
                  ? "—"
                  : `${Math.round(workspace.stats.approvalRate * 100)}%`
              }
            />
            <Stat
              label="Ready"
              value={`${readyCapabilities.length}/${capabilities.length}`}
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-3.5 space-y-2">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Account Health</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {healthItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-2 rounded-xl border border-border"
              >
                <span className="text-xs font-bold text-foreground">{item.label}</span>
                {item.done ? (
                  <span className="text-[11px] font-bold text-primary">Verified</span>
                ) : (
                  <Link href={item.href} className="text-[11px] font-bold text-primary">
                    Complete
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Connected Accounts
            </h2>
            <Link href="/settings" className="text-[11px] font-bold text-primary">
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {Object.values(platforms).map((soc) => {
              const copy = connectionCopy(soc);
              return (
                <div key={soc.platform} className="flex items-center gap-2.5 p-2 rounded-xl border border-border min-w-0">
                  <SocialBrandIcon platform={soc.platform} size={22} />
                  <p className="text-xs font-bold text-foreground min-w-0 truncate flex-1">{soc.name}</p>
                  <span className="text-[11px] font-bold text-foreground shrink-0">{copy.statusLabel}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-3.5 space-y-2">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">Capabilities</h2>
          <div className="flex flex-wrap gap-1.5">
            {readyCapabilities.map((cap) => (
              <span
                key={cap.id}
                className="h-8 px-2.5 rounded-full border border-border bg-card text-[11px] font-bold text-foreground inline-flex items-center gap-1.5"
              >
                <SocialBrandIcon platform={cap.platform} size={14} />
                {cap.label}
              </span>
            ))}
            {readyCapabilities.length === 0 ? (
              <p className="text-xs text-foreground">Connect accounts in Settings to qualify for matching tasks.</p>
            ) : null}
          </div>
        </section>
      </div>

      {employerOpen ? (
        <EmployerPreview workspace={workspace} onClose={() => setEmployerOpen(false)} />
      ) : null}
    </WorkspaceAppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-xl bg-muted border border-border text-center">
      <span className="text-[10px] font-bold text-muted-foreground uppercase block">{label}</span>
      <span className="text-sm font-black text-foreground mt-0.5 block">{value}</span>
    </div>
  );
}
