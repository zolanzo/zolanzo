"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  CheckmarkCircle01Icon,
  ArrowDown01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { WhatsAppSupportLink } from "@/components/support/whatsapp-support-link";
import { APP_CONFIG } from "@/config/app";

export function SupportView() {
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
    {
      question: "How do I contact ZOLANZO support?",
      answer: `Message WhatsApp Support at ${APP_CONFIG.supportWhatsApp.display}, or email ${APP_CONFIG.supportEmail}.`,
    },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const filteredFaqs = faqs.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-[1100px] mx-auto space-y-8 pb-20">
      <div className="pb-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Help & Support Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
            Find instant answers, or message WhatsApp Support.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/faq"
            className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground hover:bg-hover"
          >
            FAQ
          </Link>
          <WhatsAppSupportLink />
        </div>
      </div>

      <div className="relative w-full">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <HugeiconsIcon icon={Search01Icon} size={20} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help articles, payouts, task issues..."
          className="w-full h-[52px] pl-12 pr-4 rounded-2xl bg-card border border-border focus:border-primary text-foreground text-sm focus:outline-none shadow-sm"
        />
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Frequently Asked Questions</h3>

        <div className="divide-y divide-border">
          {filteredFaqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={faq.question} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between text-left font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={18}
                    className={`text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2.5 font-normal">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground uppercase tracking-wider">Submit a Support Ticket</h3>
          <p className="text-xs text-muted-foreground">
            Support ticket storage is not connected. For live help, use WhatsApp Support
            at the top of this page.
          </p>
        </div>

        {submitted && (
          <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs font-bold flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
            <span>Not sent. Ticket intake is not connected yet.</span>
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Subject</label>
            <input
              type="text"
              required
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="e.g. Question about withdrawal status"
              className="w-full h-[48px] px-4 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Message / Issue Details</label>
            <textarea
              rows={4}
              required
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Describe your question or issue in detail..."
              className="w-full p-4 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="h-[48px] px-6 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <HugeiconsIcon icon={SentIcon} size={16} />
            <span>Submit Ticket</span>
          </button>
        </form>
      </div>
    </div>
  );
}
