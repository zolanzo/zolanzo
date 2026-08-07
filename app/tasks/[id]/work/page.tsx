"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Upload01Icon,
  Shield01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";
import { MOCK_TASKS, type MarketplaceTask } from "@/lib/marketplace/mock-tasks";
import { ValidationMessage } from "@/components/auth/validation-message";
import { zolanzoEngine } from "@/lib/engine/business-engine";

interface WorkPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkWorkspacePage({ params }: WorkPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const task: MarketplaceTask = MOCK_TASKS.find((t) => t.id === resolvedParams.id) || MOCK_TASKS[0]!;

  const [evidenceText, setEvidenceText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  const toggleChecklist = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const wordCount = evidenceText.trim() ? evidenceText.trim().split(/\s+/).length : 0;
  const charCount = evidenceText.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!evidenceText.trim() && !fileName) {
      setError("Please provide text proof or upload an evidence file before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await zolanzoEngine.submitWorkEvidence("app_201", evidenceText, fileName || undefined);
    } catch {
      // Fallback
    }
    setSubmitting(false);
    router.push(`/tasks/${task.id}/submitted`);
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[900px] mx-auto space-y-6 pb-20">
        
        {/* Workspace Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href={`/tasks/${task.id}`}
            onClick={(e) => {
              if (evidenceText && !confirm("You have unsaved workspace notes. Are you sure you want to leave?")) {
                e.preventDefault();
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} /> Exit Workspace
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Progress: {Math.round((completedSteps.length / task.requirements.length) * 100)}%
            </span>

            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
              <HugeiconsIcon icon={Clock01Icon} size={14} className="animate-pulse" />
              <span>Time Remaining: 24:59</span>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Work in Progress Workspace
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{task.title}</h1>
            <p className="text-xs text-zinc-400">Hirer: {task.employerName}</p>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-2xl text-left sm:text-right shrink-0">
            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Escrow Reward</span>
            <span className="text-2xl font-black text-emerald-400">{task.reward}</span>
          </div>
        </div>

        {/* Interactive Checklist */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Opportunity Requirement Checklist</span>
            <span className="text-emerald-400">{completedSteps.length} / {task.requirements.length} Completed</span>
          </h3>

          <div className="space-y-2">
            {task.requirements.map((req: string, idx: number) => {
              const isChecked = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleChecklist(idx)}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? "bg-emerald-950/30 border-emerald-500/40 text-white font-medium"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#008744]"
                  />
                  <span className={isChecked ? "line-through text-zinc-400" : ""}>{req}</span>
                </div>
              );
            })}
          </div>
        </div>

        <ValidationMessage message={error} />

        {/* Work Submission Form */}
        <form onSubmit={handleSubmitWork} className="space-y-6">
          
          {/* Instructions Box */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} size={18} className="text-emerald-400" />
              Submission Guidelines
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Complete the requested task specifications and provide verifiable proof of work below (e.g. screenshots, proof links, or detailed summary).
            </p>
          </div>

          {/* Text Proof Entry with Word & Char Counter */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                Proof of Work / Notes
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {wordCount} Words • {charCount} Chars
              </span>
            </div>

            <textarea
              rows={5}
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder="Paste submission links, proof details, or completed task notes..."
              className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-xs sm:text-sm focus:outline-none transition-colors"
            />
          </div>

          {/* File Attachment Upload with Preview & Replace */}
          <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 space-y-3">
            <label className="text-xs font-bold text-white uppercase tracking-wider block">
              Attach Evidence Screenshots or Files
            </label>
            
            {fileName ? (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    PNG
                  </div>
                  <div>
                    <p className="font-bold text-white">{fileName}</p>
                    <p className="text-[10px] text-emerald-400">Ready for submission upload</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center transition-colors bg-zinc-900/40">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <HugeiconsIcon icon={Upload01Icon} size={24} />
                  </div>
                  <p className="text-xs font-bold text-white">
                    Click or drag files here to upload evidence
                  </p>
                  <p className="text-[10px] text-zinc-500">Supports PNG, JPG, PDF, or ZIP (Max 25MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400" />
              <span>Autosaved • Draft saved just now</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-[48px] px-8 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-md hover:-translate-y-[1px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Work for Approval</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </AppShell>
  );
}
