"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Location01Icon,
  Coins01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Tick02Icon,
  Search01Icon,
  FileUploadIcon,
  UserGroupIcon,
  Mail01Icon,
  CallIcon,
  Link01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { JobPosting, JobApplicant } from "@/lib/careers/types";
import type { StaffDepartment } from "@/lib/staff/types";

const INITIAL_JOBS: JobPosting[] = [
  {
    id: "job_1",
    title: "Senior Full-Stack Engineer (Next.js & Supabase)",
    department: "Engineering",
    employmentType: "Full-time",
    location: "Lagos, Nigeria (Hybrid / Remote)",
    salary: "₦1,500,000 - ₦2,200,000 / month",
    description:
      "We are looking for a Senior Full-Stack Engineer to scale ZOLANZO's real-time micro-tasking and escrow transaction engine across Africa.",
    requirements: [
      "5+ years building production applications with React, Next.js, and TypeScript",
      "Deep experience with PostgreSQL, Row Level Security (RLS), and Supabase",
      "Proven background in designing secure payment API integrations (Korapay, Paystack)",
      "Strong understanding of web accessibility, Core Web Vitals, and performance optimization",
    ],
    benefits: [
      "Competitive salary in USD equivalent",
      "Full health insurance coverage for family",
      "Flexible hybrid/remote working arrangements",
      "Annual learning & conference budget",
    ],
    closingDate: "2026-08-30",
    status: "Active",
    createdAt: "2026-07-20",
    applicantCount: 14,
  },
  {
    id: "job_2",
    title: "Lead Platform Content & Anti-Abuse Moderator",
    department: "Moderation",
    employmentType: "Full-time",
    location: "Lagos, Nigeria",
    salary: "₦850,000 - ₦1,200,000 / month",
    description:
      "Oversee campaign quality standards, worker task submissions, and automated risk scoring engines to ensure 100% platform trust.",
    requirements: [
      "3+ years in online platform moderation or fraud prevention",
      "Experience setting up SLA queues, dispute resolution systems, and review standards",
      "High attention to detail and ability to work in fast-paced operational teams",
    ],
    benefits: [
      "Comprehensive medical package",
      "Performance-based quarterly bonuses",
      "Career growth path to Operations Director",
    ],
    closingDate: "2026-08-25",
    status: "Active",
    createdAt: "2026-07-22",
    applicantCount: 9,
  },
  {
    id: "job_3",
    title: "Customer Support Specialist & Escalation Lead",
    department: "Support",
    employmentType: "Remote",
    location: "Remote (Nigeria / Ghana / Kenya)",
    salary: "₦550,000 - ₦750,000 / month",
    description:
      "Deliver world-class support for earners and hirers on ZOLANZO, handling ticket escalations and payment verification queries.",
    requirements: [
      "2+ years experience in fintech or marketplace customer support",
      "Excellent written communication skills in English",
      "Proficiency with Zendesk, Intercom, or internal ticket portals",
    ],
    benefits: [
      "100% Remote work flexibility",
      "Monthly home internet stipend",
      "Health insurance plan",
    ],
    closingDate: "2026-09-05",
    status: "Active",
    createdAt: "2026-07-25",
    applicantCount: 22,
  },
  {
    id: "job_4",
    title: "Financial Ledger & Escrow Operations Officer",
    department: "Finance",
    employmentType: "Full-time",
    location: "Lagos, Nigeria (Victoria Island)",
    salary: "₦1,100,000 - ₦1,600,000 / month",
    description:
      "Manage daily escrow settlements, bank payout reconciliation, and audit logs across Korapay and Paystack payment rails.",
    requirements: [
      "B.Sc in Accounting, Banking & Finance, or related discipline",
      "3+ years experience in fintech reconciliation, treasury, or escrow management",
      "Deep understanding of ledger audit trails and automated banking webhooks",
    ],
    benefits: [
      "Top-tier compensation package",
      "Flexible work perks & lunch allowances",
      "Pension & Life Assurance",
    ],
    closingDate: "2026-08-28",
    status: "Active",
    createdAt: "2026-07-28",
    applicantCount: 7,
  },
];

const DEPARTMENTS: (StaffDepartment | "All")[] = [
  "All",
  "Engineering",
  "Moderation",
  "Support",
  "Finance",
  "Operations",
  "Marketing",
  "Growth",
  "Compliance",
  "Customer Success",
];

export default function CareersPublicPage() {
  const [jobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredJobs = jobs.filter((job) => {
    const matchesDept = selectedDept === "All" || job.department === selectedDept;
    const matchesType = selectedType === "All" || job.employmentType === selectedType;
    const matchesSearch =
      searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesType && matchesSearch && job.status === "Active";
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !resumeUrl) {
      alert("Please fill out all required fields (Name, Email, Resume).");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowApplyModal(false);
      const newApplicant: JobApplicant = {
        id: `app_${Date.now()}`,
        jobId: selectedJob?.id || "job_1",
        jobTitle: selectedJob?.title || "Position",
        firstName,
        lastName,
        email,
        phone,
        resumeUrl,
        coverLetter,
        portfolioUrl,
        status: "Applied",
        appliedAt: new Date().toISOString().split("T")[0] ?? "",
      };

      // Store in window/localStorage for demo sync with staff module
      if (typeof window !== "undefined") {
        const stored = JSON.parse(localStorage.getItem("zolanzo_applicants") || "[]");
        localStorage.setItem("zolanzo_applicants", JSON.stringify([newApplicant, ...stored]));
      }

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setResumeUrl("");
      setCoverLetter("");
      setPortfolioUrl("");
      setToastMessage(`✓ Application submitted for ${selectedJob?.title}! Our hiring team will review your application.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed inset-x-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-3.5 text-xs font-bold text-primary-foreground shadow-floating animate-fadeIn sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md sm:px-5">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border bg-background px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-subtle px-3.5 py-1.5 text-xs font-bold text-primary">
            <HugeiconsIcon icon={Briefcase01Icon} size={15} />
            <span>Join the ZOLANZO Core Team</span>
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight text-foreground sm:text-6xl">
            Build the Infrastructure Empowering Africa&apos;s Digital Workforce
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            We are engineering high-throughput micro-tasking, automated financial escrow, and instant digital payout systems. Help us scale across Africa.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-2 w-2 rounded-full bg-primary"></span> 100% Competitive USD Compensation
            </span>
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-2 w-2 rounded-full bg-info"></span> Remote & Hybrid Culture
            </span>
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-2 w-2 rounded-full bg-warning"></span> Full Family Health Benefits
            </span>
          </div>
        </div>
      </section>

      {/* Filter & Search Controls */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 md:flex-row">
          <div className="relative w-full md:w-80">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search positions, technologies, locations..."
              className="h-10 w-full rounded-xl border border-border bg-input-background pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-10 rounded-xl border border-border bg-input-background px-3 text-xs text-foreground focus:outline-none"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  Department: {dept}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 rounded-xl border border-border bg-input-background px-3 text-xs text-foreground focus:outline-none"
            >
              <option value="All">Type: All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Job Listings Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <span>Open Opportunities</span>
              <span className="rounded-full border border-primary/20 bg-primary-subtle px-2.5 py-0.5 text-xs font-black text-primary">
                {filteredJobs.length} Positions
              </span>
            </h2>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-12 text-center">
              <HugeiconsIcon icon={Briefcase01Icon} size={32} className="mx-auto text-muted-foreground" />
              <div className="text-sm font-bold text-foreground">No positions matched your criteria</div>
              <p className="text-xs text-muted-foreground">Try adjusting your department or employment type filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="group space-y-4 rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="rounded-md border border-info/20 bg-info/10 px-2.5 py-0.5 text-[10px] font-bold text-info">
                          {job.department}
                        </span>
                        <span className="rounded-md border border-primary/20 bg-primary-subtle px-2.5 py-0.5 text-[10px] font-bold text-primary">
                          {job.employmentType}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-foreground transition-colors group-hover:text-primary">
                        {job.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJob(job);
                          setShowApplyModal(true);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover"
                      >
                        <span>Apply Now</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 border-t border-border pt-2 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <HugeiconsIcon icon={Location01Icon} size={14} className="text-muted-foreground" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-primary">
                      <HugeiconsIcon icon={Coins01Icon} size={14} />
                      {job.salary}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-muted-foreground" />
                      Closing: {job.closingDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* APPLY MODAL */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-md animate-fadeIn">
          <div className="relative max-h-[90vh] w-full max-w-2xl space-y-6 overflow-y-auto rounded-3xl border border-border bg-elevated p-6 text-foreground shadow-dialog sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="rounded-md border border-primary/20 bg-primary-subtle px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {selectedJob.department} • {selectedJob.employmentType}
                </span>
                <h3 className="mt-1 text-xl font-black text-foreground">{selectedJob.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                    <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-muted-foreground" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. David"
                    className="h-10 w-full rounded-xl border border-border bg-input-background px-3.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                    <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-muted-foreground" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Okafor"
                    className="h-10 w-full rounded-xl border border-border bg-input-background px-3.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                    <HugeiconsIcon icon={Mail01Icon} size={14} className="text-muted-foreground" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david.okafor@example.com"
                    className="h-10 w-full rounded-xl border border-border bg-input-background px-3.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                    <HugeiconsIcon icon={CallIcon} size={14} className="text-muted-foreground" />
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="h-10 w-full rounded-xl border border-border bg-input-background px-3.5 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                  <HugeiconsIcon icon={FileUploadIcon} size={14} className="text-muted-foreground" />
                  Resume / CV URL * (PDF Link, Google Drive, Dropbox)
                </label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/your-resume-pdf"
                  className="h-10 w-full rounded-xl border border-border bg-input-background px-3.5 font-mono text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 font-bold text-foreground">
                  <HugeiconsIcon icon={Link01Icon} size={14} className="text-muted-foreground" />
                  Portfolio / GitHub / LinkedIn URL (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourhandle or https://linkedin.com/in/yourprofile"
                  className="h-10 w-full rounded-xl border border-border bg-input-background px-3.5 font-mono text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-foreground">Cover Letter & Key Achievements</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us about your background and why you are excited to join ZOLANZO..."
                  className="w-full rounded-xl border border-border bg-input-background p-3.5 leading-relaxed text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="cursor-pointer rounded-xl bg-muted px-4 py-2.5 font-bold text-foreground transition-colors hover:bg-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting Application..." : "Submit Application"}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
