"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CheckmarkCircle01Icon,
  ArrowDown01Icon,
  SentIcon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/shell/app-shell";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      question: "How do instant bank withdrawals work?",
      answer: "Once an employer approves your submitted work, escrow funds are credited to your Available Balance. You can trigger a withdrawal anytime to your linked local bank account with your 6-digit PIN.",
    },
    {
      question: "What is the typical task review timeline?",
      answer: "Most tasks are reviewed within 6 to 24 hours. If an employer does not take action within 72 hours, the platform automatically approves the submission and releases escrow funds to your wallet.",
    },
    {
      question: "Why is Phone Verification required for applying?",
      answer: "Phone verification via SMS OTP ensures platform integrity, prevents bot spam, and protects both earners and employers on ZOLANZO.",
    },
    {
      question: "What should I do if a task submission is rejected?",
      answer: "If a submission is rejected, you will receive employer review notes explaining the reason. You may review the guidelines and apply for other active opportunities.",
    },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactSubject("");
      setContactMessage("");
    }, 3000);
  };

  return (
    <AppShell userName="Grace" avatarUrl="/brand/lady1.png">
      <div className="max-w-[1100px] mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="pb-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Help & Support Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">
              Find instant answers to common questions or send a direct ticket to our support team.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 shrink-0">
            <HugeiconsIcon icon={Message01Icon} size={16} className="text-emerald-400" />
            <span>Live Chat: Coming Soon</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <HugeiconsIcon icon={Search01Icon} size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search help articles, payouts, task issues..."
            className="w-full h-[52px] pl-12 pr-4 rounded-2xl bg-[#0A0F12] border border-white/10 focus:border-[#008744] text-white text-sm focus:outline-none shadow-sm"
          />
        </div>

        {/* FAQs */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">Frequently Asked Questions</h3>

          <div className="divide-y divide-zinc-800">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-left font-bold text-white text-sm hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={18}
                      className={`text-emerald-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2.5 font-normal">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Ticket Form */}
        <div className="bg-[#0A0F12] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Submit a Support Ticket</h3>
            <p className="text-xs text-zinc-400">Our support team responds within 2 hours on business days.</p>
          </div>

          {submitted && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>Support ticket submitted! Ticket ID: #ZOL-9812</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Subject</label>
              <input
                type="text"
                required
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="e.g. Question about withdrawal status"
                className="w-full h-[48px] px-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-xs sm:text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Message / Issue Details</label>
              <textarea
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your question or issue in detail..."
                className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#008744] text-white text-xs sm:text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="h-[48px] px-6 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <HugeiconsIcon icon={SentIcon} size={16} />
              <span>Submit Ticket</span>
            </button>
          </form>
        </div>

      </div>
    </AppShell>
  );
}
