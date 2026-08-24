"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/app-shell";
import { SocialBrandIcon } from "@/components/brand/social-brand-icon";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { inferSocialPlatform } from "@/lib/platforms/infer";
import type { WorkOpportunity } from "@/features/task-marketplace/types";
import { prepareOpportunityWorkAction } from "@/features/task-marketplace/actions/work-session-action";
import {
  attachEvidenceAction,
  submitPackageAction,
} from "@/features/submissions/actions/submission-actions";
import {
  isInlineProofKind,
  type WorkProofField,
} from "@/features/task-marketplace/services/evidence-requirements";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function OpportunityWorkView({ opportunity }: { opportunity: WorkOpportunity }) {
  const platform = inferSocialPlatform(
    opportunity.category,
    opportunity.title,
    opportunity.templateName,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [proofFields, setProofFields] = useState<WorkProofField[]>([]);
  const [submissionPublicId, setSubmissionPublicId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const session = await prepareOpportunityWorkAction(opportunity.instancePublicId);
      if (cancelled) return;
      if (!session.ok) {
        setError(session.error.message);
        return;
      }
      setInstructions(session.data.workerInstructions);
      setProofFields(session.data.proofFields);
      setSubmissionPublicId(session.data.submissionPublicId);
      setStatus(session.data.submissionStatus ?? session.data.assignmentStatus);
      if (
        session.data.submissionStatus &&
        !["draft", "ready"].includes(session.data.submissionStatus)
      ) {
        setSubmitted(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [opportunity.instancePublicId]);

  function fieldKey(field: WorkProofField, index: number): string {
    return `${field.kind}-${field.stepKey ?? index}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!submissionPublicId) {
      setError("No submission is open for this assignment.");
      return;
    }
    if (proofFields.length === 0) {
      setError("This task template does not define required proof.");
      return;
    }
    startTransition(async () => {
      for (let i = 0; i < proofFields.length; i += 1) {
        const field = proofFields[i];
        if (!field) continue;
        const key = fieldKey(field, i);
        if (isInlineProofKind(field.kind)) {
          const payload = values[key]?.trim();
          if (field.required && !payload) {
            setError(`${field.label} is required.`);
            return;
          }
          if (!payload) continue;
          const attached = await attachEvidenceAction({
            submissionPublicId,
            kind: field.kind,
            label: field.label,
            stepKey: field.stepKey,
            inlinePayload: payload,
          });
          if (!attached.ok) {
            setError(attached.error.message);
            return;
          }
        } else {
          const file = files[key];
          if (field.required && !file) {
            setError(`${field.label} is required.`);
            return;
          }
          if (!file) continue;
          const bodyBase64 = await fileToBase64(file);
          const attached = await attachEvidenceAction({
            submissionPublicId,
            kind: field.kind,
            label: field.label,
            stepKey: field.stepKey,
            bodyBase64,
            contentType: file.type || "application/octet-stream",
          });
          if (!attached.ok) {
            setError(attached.error.message);
            return;
          }
        }
      }
      const result = await submitPackageAction(submissionPublicId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSubmitted(true);
      setStatus(result.data.submission.status);
    });
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-4 px-4 py-4 pb-24">
        <Link href={`/tasks/${opportunity.instancePublicId}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          Back
        </Link>
        <section className="bg-card border border-border rounded-[20px] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <SocialBrandIcon platform={platform} size={22} />
            <div>
              <h1 className="text-base font-black text-foreground">{opportunity.title}</h1>
              <p className="text-xs text-foreground">
                {formatNgnFromMinor(opportunity.rewardPerUnitMinor)}
              </p>
            </div>
          </div>
          {instructions ? (
            <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{instructions}</p>
          ) : null}
          {status ? (
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{status.replaceAll("_", " ")}</p>
          ) : null}

          {submitted ? (
            <p className="text-xs text-foreground">
              Proof submitted. Review uses the live queue — this screen does not invent a result.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              {proofFields.map((field, index) => {
                const key = fieldKey(field, index);
                if (isInlineProofKind(field.kind)) {
                  return (
                    <label key={key} className="block space-y-1 text-xs font-semibold text-muted-foreground">
                      {field.label}
                      {field.kind === "link" ? (
                        <input
                          type="url"
                          required={field.required}
                          value={values[key] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full h-11 px-3 rounded-xl border border-border text-sm font-normal text-foreground"
                        />
                      ) : (
                        <textarea
                          required={field.required}
                          value={values[key] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                          rows={3}
                          className="w-full p-3 rounded-xl border border-border text-sm font-normal text-foreground"
                        />
                      )}
                    </label>
                  );
                }
                return (
                  <label key={key} className="block space-y-1 text-xs font-semibold text-muted-foreground">
                    {field.label}
                    <input
                      type="file"
                      required={field.required}
                      onChange={(e) =>
                        setFiles((prev) => ({ ...prev, [key]: e.target.files?.[0] ?? null }))
                      }
                      className="w-full text-sm"
                    />
                  </label>
                );
              })}
              {proofFields.length === 0 && !error ? (
                <p className="text-xs text-muted-foreground">
                  This template does not define required proof, so a submission cannot be assembled.
                </p>
              ) : null}
              {error ? <p className="text-xs text-danger">{error}</p> : null}
              <button
                type="submit"
                disabled={pending || !submissionPublicId || proofFields.length === 0}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Submit proof"}
              </button>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
