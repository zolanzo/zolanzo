"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceAppShell } from "@/components/shell/workspace-app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/identity/user-avatar";
import {
  getHirerSubmissionReviewAction,
  recordHirerSubmissionDecisionAction,
  type HirerReviewDetail,
} from "@/features/verification/actions/hirer-review-action";
import type { HirerReviewRow, HirerWorkspace } from "@/lib/workspace/hirer-types";

function reviewLabel(status: string): "Pending" | "Accepted" | "Rejected" | "Revision Requested" | "Other" {
  if (["submitted", "validating", "validation_complete", "in_review"].includes(status)) {
    return "Pending";
  }
  if (status === "approved") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "revision_requested") return "Revision Requested";
  return "Other";
}

export function HirerApplicationsView({
  workspace,
}: {
  workspace: HirerWorkspace;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<HirerReviewRow | null>(null);
  const [detail, setDetail] = useState<HirerReviewDetail | null>(null);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return workspace.pendingReviews.filter((row) => {
      const label = reviewLabel(row.status);
      const matchesFilter = filter === "All" || label === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        row.workerName.toLowerCase().includes(q) ||
        row.campaignName.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [workspace.pendingReviews, filter, search]);

  const pendingCount = workspace.pendingReviews.filter(
    (row) => reviewLabel(row.status) === "Pending",
  ).length;

  function openRow(row: HirerReviewRow) {
    setSelected(row);
    setDetail(null);
    setComments("");
    setError(null);
    startTransition(async () => {
      const result = await getHirerSubmissionReviewAction(row.publicId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setDetail(result.data);
    });
  }

  function decide(outcome: "approved" | "rejected") {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await recordHirerSubmissionDecisionAction({
        submissionPublicId: selected.publicId,
        outcome,
        comments,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSelected(null);
      setDetail(null);
      router.refresh();
    });
  }

  return (
    <WorkspaceAppShell workspace={workspace}>
      <div className="mx-auto max-w-4xl space-y-4 pb-20">
        <div>
          <h1 className="text-xl font-black text-foreground">Review queue</h1>
          <p className="mt-1 text-xs text-muted-foreground">{pendingCount} awaiting a decision</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex gap-1 overflow-x-auto">
            {["Pending", "Accepted", "Rejected", "Revision Requested", "All"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                aria-pressed={filter === tab}
                className={`h-9 px-3 rounded-xl text-xs font-bold ${
                  filter === tab
                    ? "border border-primary/25 bg-primary-subtle text-primary"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker or campaign"
            aria-label="Search worker or campaign"
            className="h-9 rounded-xl border border-border px-3 text-xs"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No submissions"
            description="Completed work from your campaigns will appear here after earners submit proof."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => openRow(row)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={row.workerName} src={row.workerAvatarUrl} size={36} className="rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{row.workerName}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{row.campaignName}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-black">{row.rewardLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{reviewLabel(row.status)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected ? (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-bold">{detail?.campaignName ?? selected.campaignName}</p>
            <p className="text-xs text-muted-foreground">
              {detail?.workerName ?? selected.workerName} · {selected.publicId}
            </p>
            {detail?.instructions ? (
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {detail.instructions}
              </p>
            ) : null}
            {detail?.evidence.length ? (
              <ul className="space-y-2">
                {detail.evidence.map((item) => (
                  <li key={item.id} className="rounded-xl border border-border bg-muted p-2.5">
                    <p className="text-[11px] font-bold text-foreground">{item.label}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{item.kind}</p>
                    {item.preview ? (
                      <p className="mt-1 break-all text-xs text-foreground">{item.preview}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">File proof attached</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : pending && !detail ? (
              <p className="text-xs text-muted-foreground">Loading submitted work…</p>
            ) : (
              <p className="text-xs text-muted-foreground">No proof items on this package yet.</p>
            )}
            {detail?.canDecide ? (
              <label className="block space-y-1 text-xs font-semibold text-muted-foreground">
                Note (optional)
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border p-2 text-sm font-normal text-foreground"
                />
              </label>
            ) : null}
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            {detail?.blockedReason ? (
              <p className="text-xs text-muted-foreground">{detail.blockedReason}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {detail?.canDecide ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => decide("approved")}
                    className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {pending ? "Saving…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => decide("rejected")}
                    className="h-10 rounded-xl border border-border px-4 text-xs font-bold disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              ) : null}
              <Link
                href={`/hirer/opportunities/${selected.campaignPublicId}`}
                className="flex h-10 items-center text-xs font-bold text-primary"
              >
                View task
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setDetail(null);
                }}
                className="h-10 px-2 text-xs font-bold text-muted-foreground"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </WorkspaceAppShell>
  );
}
