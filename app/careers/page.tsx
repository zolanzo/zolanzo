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
    <div className="min-h-screen bg-[#050608] text-white selection:bg-[#008744] selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#008744] text-white px-5 py-3.5 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border border-emerald-400/40 animate-fadeIn">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] bg-gradient-to-b from-[#080C10] to-[#050608] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <HugeiconsIcon icon={Briefcase01Icon} size={15} />
            <span>Join the ZOLANZO Core Team</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Build the Infrastructure Empowering Africa&apos;s Digital Workforce
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            We are engineering high-throughput micro-tasking, automated financial escrow, and instant digital payout systems. Help us scale across Africa.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400 font-semibold">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 100% Competitive USD Compensation
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Remote & Hybrid Culture
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Full Family Health Benefits
            </span>
          </div>
        </div>
      </section>

      {/* Filter & Search Controls */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D1218] border border-white/[0.08]">
          <div className="relative w-full md:w-80">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search positions, technologies, locations..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#131922] border border-white/[0.08] focus:border-[#008744] text-white text-xs focus:outline-none placeholder-zinc-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#131922] border border-white/[0.08] text-white text-xs focus:outline-none"
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
              className="h-10 px-3 rounded-xl bg-[#131922] border border-white/[0.08] text-white text-xs focus:outline-none"
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
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Open Opportunities</span>
              <span className="px-2.5 py-0.5 text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                {filteredJobs.length} Positions
              </span>
            </h2>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0D1218] border border-white/[0.08] space-y-3">
              <HugeiconsIcon icon={Briefcase01Icon} size={32} className="mx-auto text-zinc-600" />
              <div className="text-sm font-bold text-zinc-300">No positions matched your criteria</div>
              <p className="text-xs text-zinc-500">Try adjusting your department or employment type filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl bg-[#0D1218] border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 space-y-4 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                          {job.department}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                          {job.employmentType}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">
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
                        className="px-5 py-2.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Apply Now</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/[0.06] text-xs text-zinc-400 font-medium">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <HugeiconsIcon icon={Location01Icon} size={14} className="text-zinc-500" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <HugeiconsIcon icon={Coins01Icon} size={14} />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-400 ml-auto text-[11px]">
                      <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-zinc-500" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#131922] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  {selectedJob.department} • {selectedJob.employmentType}
                </span>
                <h3 className="text-xl font-black text-white mt-1">{selectedJob.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-zinc-500" />
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. David"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-zinc-500" />
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Okafor"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Mail01Icon} size={14} className="text-zinc-500" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="david.okafor@example.com"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                    <HugeiconsIcon icon={CallIcon} size={14} className="text-zinc-500" />
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                  <HugeiconsIcon icon={FileUploadIcon} size={14} className="text-zinc-500" />
                  Resume / CV URL * (PDF Link, Google Drive, Dropbox)
                </label>
                <input
                  type="url"
                  required
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/your-resume-pdf"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Link01Icon} size={14} className="text-zinc-500" />
                  Portfolio / GitHub / LinkedIn URL (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourhandle or https://linkedin.com/in/yourprofile"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-bold block mb-1">Cover Letter & Key Achievements</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us about your background and why you are excited to join ZOLANZO..."
                  className="w-full p-3.5 rounded-xl bg-[#0D1218] border border-white/[0.08] focus:border-[#008744] text-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#008744] hover:bg-[#00753b] text-white font-bold transition-all shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
