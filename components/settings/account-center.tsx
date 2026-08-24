"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { useToast } from "@/providers/toast-provider";
import { formatNgnFromMinor, nairaToMinor } from "@/lib/money/ngn";
import type { EarnerWorkspace } from "@/lib/workspace/earner-types";
import { isLiveBoundary } from "@/lib/workspace/data-boundary";
import { connectionCopy, useCapabilities } from "@/lib/capabilities-service";
import { ConnectAccountSheet } from "@/components/marketplace/connect-account-sheet";
import type { OpportunityPreferences } from "@/features/settings/types";
import {
  AVAILABILITY_WINDOWS,
  NIGERIA_STATES,
  PREFERENCE_CATEGORIES,
  PREFERENCE_PLATFORMS,
} from "@/features/settings/constants";
import {
  saveAccountProfileAction,
  saveMarketingOptInAction,
  saveOpportunityPreferencesAction,
  signOutAction,
} from "@/features/settings/actions/settings-actions";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  CustomerSupportIcon,
  InformationCircleIcon,
  Logout01Icon,
  Settings01Icon,
  Share01Icon,
  Target01Icon,
  UserIcon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";

type SectionId =
  | "profile"
  | "health"
  | "socials"
  | "opportunity"
  | "invite"
  | "support"
  | "preferences"
  | "about"
  | "danger"
  | null;

export function AccountCenter({ workspace }: { workspace: EarnerWorkspace }) {
  const { toast } = useToast();
  const { platforms, getTaskAccess } = useCapabilities();
  const live = isLiveBoundary(workspace.loadState);
  const [open, setOpen] = useState<SectionId>(null);
  const [saving, setSaving] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(workspace.displayName);
  const [handle, setHandle] = useState(workspace.handle);
  const [legalName, setLegalName] = useState(workspace.legalName ?? "");
  const [state, setState] = useState(workspace.preferences.preferredState ?? "");
  const [city, setCity] = useState(workspace.preferences.preferredCity ?? "");
  const [prefs, setPrefs] = useState<OpportunityPreferences>(workspace.preferences);
  const [marketing, setMarketing] = useState(workspace.marketingOptIn);

  const toggle = (id: SectionId) => setOpen((prev) => (prev === id ? null : id));

  const minNaira = useMemo(
    () => Math.round(prefs.minRewardMinor / 100),
    [prefs.minRewardMinor],
  );

  async function saveProfile() {
    if (!live) {
      toast({ title: "Sign in to save profile", variant: "warning" });
      return;
    }
    setSaving(true);
    const result = await saveAccountProfileAction({
      displayName,
      handle: handle.replace(/^@/, "").toLowerCase(),
      legalName: legalName || null,
      preferredState: state || null,
      preferredCity: city || null,
    });
    setSaving(false);
    if (!result.ok) {
      toast({ title: result.error.message, variant: "danger" });
      return;
    }
    toast({ title: "Profile saved", variant: "success" });
  }

  async function savePrefs() {
    if (!live) {
      toast({ title: "Sign in to save preferences", variant: "warning" });
      return;
    }
    setSaving(true);
    const result = await saveOpportunityPreferencesAction(prefs);
    setSaving(false);
    if (!result.ok) {
      toast({ title: result.error.message, variant: "danger" });
      return;
    }
    toast({ title: "Preferences saved", variant: "success" });
  }

  async function copyReferral() {
    if (!live) {
      toast({ title: "Referral link is unavailable until you are signed in", variant: "warning" });
      return;
    }
    await navigator.clipboard.writeText(workspace.referralUrl);
    toast({ title: "Referral link copied", variant: "success" });
  }

  const connectReadiness = connectPlatform ? getTaskAccess(connectPlatform) : null;

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="max-w-3xl mx-auto space-y-3 px-4 sm:px-0 pb-4">
        <h1 className="text-lg font-black text-foreground tracking-tight">Account Center</h1>

        <div className="space-y-3">
          <Accordion
            id="profile"
            open={open}
            toggle={toggle}
            icon={UserIcon}
            title="Profile"
            subtitle="Name, handle, and location"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Field label="Full name" value={displayName} onChange={setDisplayName} />
              <Field label="Username" value={handle} onChange={setHandle} />
              <Field label="Legal name" value={legalName} onChange={setLegalName} />
              <div>
                <label className="font-bold text-foreground block mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border font-bold"
                >
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="City" value={city} onChange={setCity} />
            </div>
            <button
              type="button"
              disabled={saving || !live}
              onClick={saveProfile}
              className="mt-3 h-10 px-4 rounded-xl bg-foreground text-background text-xs font-bold disabled:bg-muted disabled:text-muted-foreground"
            >
              Save profile
            </button>
          </Accordion>

          <Accordion
            id="opportunity"
            open={open}
            toggle={toggle}
            icon={Target01Icon}
            title="Opportunity Preferences"
            subtitle="State, platforms, and matching alerts"
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Remote work</span>
                <Toggle
                  on={prefs.remotePreferred}
                  onChange={(v) => setPrefs((p) => ({ ...p, remotePreferred: v }))}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-foreground">Minimum reward</span>
                  <span className="font-black">{formatNgnFromMinor(prefs.minRewardMinor)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={5}
                  value={minNaira}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      minRewardMinor: nairaToMinor(Number(e.target.value)),
                    }))
                  }
                  className="w-full accent-emerald-700"
                />
              </div>
              <ChipRow
                label="Platforms"
                items={PREFERENCE_PLATFORMS.map((p) => p.key)}
                selected={prefs.preferredPlatforms}
                render={(key) => (
                  <span className="inline-flex items-center gap-1">
                    <SocialBrandIcon platform={key} size={14} />
                    {PREFERENCE_PLATFORMS.find((p) => p.key === key)?.label}
                  </span>
                )}
                onToggle={(key) =>
                  setPrefs((p) => ({
                    ...p,
                    preferredPlatforms: p.preferredPlatforms.includes(key)
                      ? p.preferredPlatforms.filter((x) => x !== key)
                      : [...p.preferredPlatforms, key],
                  }))
                }
              />
              <ChipRow
                label="Categories"
                items={PREFERENCE_CATEGORIES.map((c) => c.key)}
                selected={prefs.preferredCategories}
                render={(key) => PREFERENCE_CATEGORIES.find((c) => c.key === key)?.label ?? key}
                onToggle={(key) =>
                  setPrefs((p) => ({
                    ...p,
                    preferredCategories: p.preferredCategories.includes(key)
                      ? p.preferredCategories.filter((x) => x !== key)
                      : [...p.preferredCategories, key],
                  }))
                }
              />
              <ChipRow
                label="Availability"
                items={[...AVAILABILITY_WINDOWS]}
                selected={prefs.availability}
                render={(key) => key}
                onToggle={(key) =>
                  setPrefs((p) => ({
                    ...p,
                    availability: p.availability.includes(key)
                      ? p.availability.filter((x) => x !== key)
                      : [...p.availability, key],
                  }))
                }
              />
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Matching task notifications</span>
                <Toggle
                  on={prefs.matchingNotifications}
                  onChange={(v) => setPrefs((p) => ({ ...p, matchingNotifications: v }))}
                />
              </div>
              <button
                type="button"
                disabled={saving || !live}
                onClick={savePrefs}
                className="h-10 px-4 rounded-xl bg-foreground text-background text-xs font-bold disabled:bg-muted disabled:text-muted-foreground"
              >
                Save preferences
              </button>
            </div>
          </Accordion>

          <Accordion
            id="health"
            open={open}
            toggle={toggle}
            icon={CheckmarkCircle01Icon}
            title="Account Health"
            subtitle="Verification required for payouts"
          >
            <div className="space-y-2 text-xs">
              <HealthRow label="Email" done={workspace.verification.email} href="/verify-email" />
              <HealthRow label="Phone" done={workspace.verification.phone} href="/verify-phone" />
              <HealthRow label="Bank" done={workspace.verification.bank} href="/wallet" />
              <HealthRow label="Identity" done={workspace.verification.identity} href="/support" />
            </div>
          </Accordion>

          <Accordion
            id="socials"
            open={open}
            toggle={toggle}
            icon={Share01Icon}
            title="Connected Accounts"
            subtitle="Platforms used for task proof"
          >
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground leading-snug">
                Status is saved on this device. It is not a live verification.
              </p>
              {Object.values(platforms).map((soc) => {
                const copy = connectionCopy(soc);
                const showAction =
                  copy.actionLabel === "Connect" ||
                  copy.actionLabel === "Reconnect" ||
                  copy.actionLabel === "View status";
                return (
                  <div
                    key={soc.platform}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SocialBrandIcon platform={soc.platform} size={24} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{soc.name}</p>
                        <p className="text-[11px] font-bold text-muted-foreground">{copy.statusLabel}</p>
                      </div>
                    </div>
                    {showAction ? (
                      <button
                        type="button"
                        onClick={() => setConnectPlatform(soc.platform)}
                        className="h-9 px-3 rounded-lg bg-foreground text-background text-[11px] font-bold shrink-0"
                      >
                        {copy.actionLabel}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Accordion>

          <Accordion
            id="invite"
            open={open}
            toggle={toggle}
            icon={Copy01Icon}
            title="Invite & Earn"
            subtitle="Share your personal signup link"
          >
            <div className="flex gap-2">
              <input
                readOnly
                value={workspace.referralUrl}
                className="flex-1 h-10 px-3 rounded-xl border border-border font-mono text-xs"
              />
              <button
                type="button"
                onClick={copyReferral}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Copy
              </button>
            </div>
          </Accordion>

          <Accordion
            id="support"
            open={open}
            toggle={toggle}
            icon={CustomerSupportIcon}
            title="Support"
            subtitle="Help, tickets, and disputes"
          >
            <div className="space-y-2 text-xs">
              <WhatsAppSupportLink variant="card" />
              <Link href="/support" className="block p-3 rounded-xl bg-card border border-border font-bold">
                Support center →
              </Link>
              <Link href="/faq" className="block p-3 rounded-xl bg-card border border-border font-bold">
                FAQ →
              </Link>
            </div>
          </Accordion>

          <Accordion
            id="preferences"
            open={open}
            toggle={toggle}
            icon={Settings01Icon}
            title="Preferences"
            subtitle="Marketing and security"
          >
            <label className="flex items-center justify-between p-3 bg-card border border-border rounded-xl text-xs font-bold">
              <span>Marketing emails</span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={async (e) => {
                  const next = e.target.checked;
                  if (!live) {
                    toast({ title: "Sign in to save preferences", variant: "warning" });
                    return;
                  }
                  setMarketing(next);
                  const result = await saveMarketingOptInAction(next);
                  if (!result.ok) {
                    setMarketing(!next);
                    toast({ title: result.error.message, variant: "danger" });
                  }
                }}
              />
            </label>
            <Link
              href="/reset-pin"
              className="mt-2 inline-flex h-10 px-4 rounded-xl bg-muted text-xs font-bold items-center"
            >
              Change PIN
            </Link>
          </Accordion>

          <Accordion
            id="about"
            open={open}
            toggle={toggle}
            icon={InformationCircleIcon}
            title="About"
            subtitle="Legal and version"
          >
            <div className="space-y-2 text-xs">
              <p className="p-3 bg-card border border-border rounded-xl font-bold">
                Zolanzo marketplace
              </p>
              <Link href="/support" className="block p-3 bg-card border border-border rounded-xl font-bold">
                Terms & privacy →
              </Link>
            </div>
          </Accordion>

          <Accordion
            id="danger"
            open={open}
            toggle={toggle}
            icon={AlertCircleIcon}
            title="Security / Danger Zone"
            subtitle="Sign out or contact support"
            danger
          >
            <p className="text-xs text-muted-foreground">
              Account deletion is handled by support so earnings and disputes stay intact.
            </p>
            <Link
              href="/support"
              className="mt-2 inline-flex h-10 px-4 rounded-xl bg-danger text-danger-foreground text-xs font-bold items-center"
            >
              Request account deletion
            </Link>
          </Accordion>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full h-11 rounded-[18px] bg-danger/10 border border-danger/25 text-danger text-xs font-black flex items-center justify-center gap-2"
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} />
            Sign out
          </button>
        </form>
        {connectPlatform && connectReadiness ? (
          <ConnectAccountSheet
            platform={connectPlatform}
            readiness={connectReadiness}
            isOpen
            onClose={() => setConnectPlatform(null)}
            onSuccess={() => setConnectPlatform(null)}
          />
        ) : null}
      </div>
    </WorkspaceAppShell>
  );
}

function Accordion({
  id,
  open,
  toggle,
  icon,
  title,
  subtitle,
  children,
  danger = false,
}: {
  id: Exclude<SectionId, null>;
  open: SectionId;
  toggle: (id: SectionId) => void;
  icon: typeof UserIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const expanded = open === id;
  return (
    <div className={`bg-card rounded-2xl border overflow-hidden ${danger ? "border-danger/30" : "border-border"}`}>
      <button
        type="button"
        onClick={() => toggle(id)}
        aria-expanded={expanded}
        className="w-full p-3 flex items-center justify-between text-left min-h-12"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-danger/10 text-danger" : "bg-muted text-foreground"}`}>
            <HugeiconsIcon icon={icon} size={18} />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-bold ${danger ? "text-danger" : "text-foreground"}`}>{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded ? <div className="px-3 pb-3 border-t border-border pt-3">{children}</div> : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="font-bold text-foreground block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl bg-card border border-border font-bold text-foreground"
      />
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative inline-flex h-6 w-10 rounded-full ${on ? "bg-primary" : "bg-muted"}`}
      aria-label={on ? "On" : "Off"}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-card ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function ChipRow({
  label,
  items,
  selected,
  onToggle,
  render,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (key: string) => void;
  render: (key: string) => React.ReactNode;
}) {
  return (
    <div>
      <p className="font-bold text-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((key) => {
          const on = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={`h-8 px-2.5 rounded-full text-[11px] font-bold border ${
                on ? "border-foreground bg-foreground text-background" : "border-border bg-muted text-foreground"
              }`}
            >
              {render(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HealthRow({ label, done, href }: { label: string; done: boolean; href: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
      <span className="font-bold text-foreground">{done ? "✓" : "!"} {label}</span>
      {done ? (
        <span className="text-primary font-bold">Verified</span>
      ) : (
        <Link href={href} className="h-7 px-3 rounded-lg bg-primary text-primary-foreground font-bold">
          Complete
        </Link>
      )}
    </div>
  );
}
