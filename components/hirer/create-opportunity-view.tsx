"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { createHirerOpportunityAction } from "@/features/campaigns/actions/hirer-campaign-action";
import { submitCampaignReviewAction } from "@/features/campaigns/actions/campaign-actions";
import type { HirerWorkspace } from "@/lib/workspace/hirer-types";
import { nairaToMinor, formatNgnFromMinor } from "@/lib/money/ngn";

export function CreateOpportunityView({
  workspace,
}: {
  workspace: HirerWorkspace;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(workspace.templates[0]?.category ?? "General");
  const [taskTemplateId, setTaskTemplateId] = useState(workspace.templates[0]?.id ?? "");
  const [rewardPerSlot, setRewardPerSlot] = useState("");
  const [slots, setSlots] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [instructions, setInstructions] = useState("");
  const [countries, setCountries] = useState("NG");
  const [languages, setLanguages] = useState("");
  const [platform, setPlatform] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rewardNum = Number(rewardPerSlot);
  const slotsNum = Number(slots);
  const subtotalMinor =
    Number.isFinite(rewardNum) && Number.isFinite(slotsNum) && rewardNum > 0 && slotsNum > 0
      ? nairaToMinor(rewardNum) * slotsNum
      : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!workspace.organization) {
      setError("Join or create an organization before creating a campaign.");
      return;
    }
    if (workspace.templates.length === 0) {
      setError("No task templates exist yet. Campaigns require a task template.");
      return;
    }
    setBusy(true);
    const created = await createHirerOpportunityAction({
      title,
      category,
      description,
      instructions,
      requirements,
      rewardNaira: rewardNum,
      slots: slotsNum,
      taskTemplateId,
      countries,
      languages,
      platform,
    });
    if (!created.ok) {
      setBusy(false);
      setError(created.error.message);
      return;
    }
    const submitted = await submitCampaignReviewAction(created.data.id);
    setBusy(false);
    if (!submitted.ok) {
      setError(submitted.error.message);
      router.push(`/hirer/opportunities/${created.data.publicId}`);
      return;
    }
    router.push("/hirer/opportunities");
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <form onSubmit={onSubmit} className="max-w-xl mx-auto space-y-4 pb-20">
        <Link href="/hirer/opportunities" className="text-xs font-bold text-muted-foreground">
          ← Campaigns
        </Link>
        <h1 className="text-xl font-black text-foreground">Create campaign</h1>
        {!workspace.organization ? (
          <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-2xl p-3">
            No active organization on this session. Campaigns are organization-scoped.
          </p>
        ) : null}
        {workspace.templates.length === 0 ? (
          <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-2xl p-3">
            No task templates are available. A campaign cannot be created until a template exists.
          </p>
        ) : null}

        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Title
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal text-foreground" />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Template
          <select
            required
            value={taskTemplateId}
            onChange={(e) => setTaskTemplateId(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-border text-sm"
          >
            {workspace.templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.status})
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Platform
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-border text-sm"
          >
            <option value="">Select platform</option>
            {["TikTok", "Instagram", "Facebook", "YouTube", "WhatsApp", "Telegram", "Threads", "X", "LinkedIn", "Website", "GooglePlay"].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            Reward (₦)
            <input required type="number" min={1} value={rewardPerSlot} onChange={(e) => setRewardPerSlot(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            Slots
            <input required type="number" min={1} value={slots} onChange={(e) => setSlots(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal" />
          </label>
        </div>
        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Description
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-3 rounded-xl border border-border text-sm font-normal" />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Worker instructions
          <textarea required value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} className="w-full p-3 rounded-xl border border-border text-sm font-normal" />
        </label>
        <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
          Quality requirements
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} className="w-full p-3 rounded-xl border border-border text-sm font-normal" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            Countries
            <input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="NG, GH" className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal" />
          </label>
          <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
            Languages
            <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal" />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Estimated worker budget {formatNgnFromMinor(subtotalMinor)}. Funds are not invented or locked until a real payment succeeds.
        </p>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !workspace.organization || workspace.templates.length === 0}
          className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save draft for review"}
        </button>
      </form>
    </WorkspaceAppShell>
  );
}
