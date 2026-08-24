"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  UserCheck01Icon,
  Add01Icon,
  Cancel01Icon,
  Tick02Icon,
  UserAdd01Icon,
  Mail01Icon,
  Coins01Icon,
  Location01Icon,
  Copy01Icon,
  ArchiveIcon,
  LockKeyIcon,
} from "@hugeicons/core-free-icons";
import type {
  JobPosting,
  JobApplicant,
  EmploymentType,
  ApplicationPipelineStatus,
} from "@/lib/careers/types";
import type { StaffDepartment, StaffRole, StaffMember } from "@/lib/staff/types";

const INITIAL_JOBS: JobPosting[] = [
  {
    id: "job_1",
    title: "Senior Full-Stack Engineer (Next.js & Supabase)",
    department: "Engineering",
    employmentType: "Full-time",
    location: "Lagos, Nigeria (Hybrid / Remote)",
    salary: "₦1,500,000 - ₦2,200,000 / month",
    description: "Build Next.js real-time micro-tasking and escrow engine.",
    requirements: ["5+ years React/Next.js", "PostgreSQL/Supabase RLS", "Korapay/Paystack APIs"],
    benefits: ["USD Compensation", "Health Insurance", "Remote Flexibility"],
    closingDate: "2026-08-30",
    status: "Active",
    createdAt: "2026-07-20",
    applicantCount: 3,
  },
  {
    id: "job_2",
    title: "Lead Platform Content & Anti-Abuse Moderator",
    department: "Moderation",
    employmentType: "Full-time",
    location: "Lagos, Nigeria",
    salary: "₦850,000 - ₦1,200,000 / month",
    description: "Oversee campaign quality standards and automated risk scoring engines.",
    requirements: ["3+ years moderation/fraud prevention", "Dispute resolution experience"],
    benefits: ["Medical package", "Quarterly bonuses"],
    closingDate: "2026-08-25",
    status: "Active",
    createdAt: "2026-07-22",
    applicantCount: 2,
  },
];

const INITIAL_APPLICANTS: JobApplicant[] = [
  {
    id: "app_101",
    jobId: "job_1",
    jobTitle: "Senior Full-Stack Engineer (Next.js & Supabase)",
    firstName: "Emmanuel",
    lastName: "Eze",
    email: "emmanuel.eze@example.com",
    phone: "+234 802 111 2233",
    resumeUrl: "https://drive.google.com/file/d/emmanuel-eze-resume.pdf",
    coverLetter: "Experienced Next.js & Supabase engineer with 6 years experience in fintech scaling.",
    portfolioUrl: "https://github.com/emmanueleze",
    status: "Applied",
    appliedAt: "2026-07-25",
  },
  {
    id: "app_102",
    jobId: "job_2",
    jobTitle: "Lead Platform Content & Anti-Abuse Moderator",
    firstName: "Blessing",
    lastName: "Okoro",
    email: "blessing.okoro@example.com",
    phone: "+234 813 444 5566",
    resumeUrl: "https://drive.google.com/file/d/blessing-okoro-cv.pdf",
    coverLetter: "4 years leading trust & safety team at African e-commerce platform.",
    portfolioUrl: "https://linkedin.com/in/blessingokoro",
    status: "Interview",
    appliedAt: "2026-07-26",
  },
];

const STAGES: ApplicationPipelineStatus[] = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

const DEPARTMENTS: StaffDepartment[] = [
  "Support",
  "Finance",
  "Moderation",
  "Operations",
  "Marketing",
  "Engineering",
  "Growth",
  "Compliance",
  "Customer Success",
];

export function AdminCareersManager() {
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const generateUniqueId = (prefix: string) => {
    const val = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
    return `${prefix}_${val}`;
  };

  const [applicants, setApplicants] = useState<JobApplicant[]>(() => {
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("zolanzo_applicants") || "[]");
      if (stored.length > 0) {
        const existingIds = new Set(INITIAL_APPLICANTS.map((a) => a.id));
        const newItems = stored.filter((s: JobApplicant) => !existingIds.has(s.id));
        return [...newItems, ...INITIAL_APPLICANTS];
      }
    }
    return INITIAL_APPLICANTS;
  });

  const [selectedJobIdFilter, setSelectedJobIdFilter] = useState<string>("All");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showHireSuccessModal, setShowHireSuccessModal] = useState<{
    applicant: JobApplicant;
    staffPin: string;
  } | null>(null);

  // Create Job Form
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<StaffDepartment>("Engineering");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("Full-time");
  const [location, setLocation] = useState("Lagos, Nigeria (Hybrid / Remote)");
  const [salary, setSalary] = useState("₦1,200,000 - ₦1,800,000 / month");
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [benefitsText, setBenefitsText] = useState("");
  const [closingDate, setClosingDate] = useState("2026-09-30");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      alert("Title and description are required.");
      return;
    }

    const newJob: JobPosting = {
      id: generateUniqueId("job"),
      title,
      department,
      employmentType,
      location,
      salary,
      description,
      requirements: requirementsText.split("\n").filter(Boolean),
      benefits: benefitsText.split("\n").filter(Boolean),
      closingDate,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0] ?? "",
      applicantCount: 0,
    };

    setJobs([newJob, ...jobs]);
    setShowCreateJobModal(false);
    setTitle("");
    setDescription("");
    setRequirementsText("");
    setBenefitsText("");
    triggerToast(`✓ Job posting "${newJob.title}" created successfully!`);
  };

  const handleDuplicateJob = (job: JobPosting) => {
    const duplicated: JobPosting = {
      ...job,
      id: generateUniqueId("job"),
      title: `${job.title} (Copy)`,
      status: "Draft",
      applicantCount: 0,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
    };
    setJobs([duplicated, ...jobs]);
    triggerToast(`Job duplicated as Draft: "${duplicated.title}".`);
  };

  const handleCloseJob = (id: string) => {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, status: "Closed" } : j)));
    triggerToast("Job posting status set to Closed.");
  };

  const handleArchiveJob = (id: string) => {
    setJobs(jobs.map((j) => (j.id === id ? { ...j, status: "Archived" } : j)));
    triggerToast("Job posting archived.");
  };

  const handleMoveStage = (applicantId: string, newStage: ApplicationPipelineStatus) => {
    setApplicants(
      applicants.map((a) => (a.id === applicantId ? { ...a, status: newStage } : a))
    );
    triggerToast(`Applicant pipeline stage updated to ${newStage}.`);
  };

  // AUTOMATED HIRE FLOW
  const handleHireApplicant = (applicant: JobApplicant) => {
    // 1. Generate temp PIN
    const val = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
    const tempPin = (100000 + (val % 900000)).toString();

    // 2. Map department to default staff role
    const departmentRoleMap: Record<StaffDepartment, StaffRole> = {
      Engineering: "Developer",
      Moderation: "Moderator",
      Support: "Support Agent",
      Finance: "Finance Officer",
      Operations: "Manager",
      Marketing: "Manager",
      Growth: "Manager",
      Compliance: "Moderator",
      "Customer Success": "Support Agent",
    };

    const targetJob = jobs.find((j) => j.id === applicant.jobId);
    const department: StaffDepartment = targetJob?.department || "Support";
    const staffRole: StaffRole = departmentRoleMap[department] || "Support Agent";

    // 3. Create staff record
    const newStaff: StaffMember = {
      id: generateUniqueId("stf"),
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone || "+234 800 000 0000",
      department,
      role: staffRole,
      manager: "Samuel Kalu",
      status: "Active",
      tempPin,
      mustChangePinOnLogin: true,
      createdAt: new Date().toISOString().split("T")[0] ?? "",
    };

    // 4. Update applicant status to Hired
    setApplicants(
      applicants.map((a) =>
        a.id === applicant.id
          ? {
              ...a,
              status: "Hired",
              hiredAt: new Date().toISOString().split("T")[0],
              generatedStaffId: newStaff.id,
              generatedTempPin: tempPin,
            }
          : a
      )
    );

    // 5. Save to local staff list store
    if (typeof window !== "undefined") {
      const existingStaff = JSON.parse(localStorage.getItem("zolanzo_staff_members") || "[]");
      localStorage.setItem(
        "zolanzo_staff_members",
        JSON.stringify([newStaff, ...existingStaff])
      );
    }

    // 6. Display automated hire modal confirmation
    setShowHireSuccessModal({
      applicant,
      staffPin: tempPin,
    });
  };

  const filteredApplicants = applicants.filter((a) => {
    const matchesJob = selectedJobIdFilter === "All" || a.jobId === selectedJobIdFilter;
    const matchesStage = selectedStageFilter === "All" || a.status === selectedStageFilter;
    return matchesJob && matchesStage;
  });

  return (
    <div className="space-y-8 text-xs font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed inset-x-4 top-4 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-3 font-bold text-primary-foreground shadow-2xl animate-fadeIn sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md sm:px-5">
          <HugeiconsIcon icon={Tick02Icon} size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-2xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-foreground">Careers & Automated Applicant ATS</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 rounded-full">
              Automated Staff Provisioning
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Manage job postings, review applicant pipeline, and hire candidates directly into ZOLANZO Staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateJobModal(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          <span>Create New Job Posting</span>
        </button>
      </div>

      {/* SECTION 1: JOB POSTINGS MANAGEMENT */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <HugeiconsIcon icon={Briefcase01Icon} size={18} className="text-primary" />
          <span>Active Job Postings ({jobs.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-info/10 text-info border border-info/20 rounded-md">
                      {job.department}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-primary-subtle text-primary border border-primary/20 rounded-md">
                      {job.employmentType}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        job.status === "Active"
                          ? "bg-primary-subtle text-primary border-primary/20"
                          : job.status === "Closed"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-danger/10 text-danger border-danger/20"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm mt-1">{job.title}</h4>
                </div>
              </div>

              <div className="text-muted-foreground text-xs line-clamp-2">{job.description}</div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={Location01Icon} size={13} className="text-muted-foreground" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1 text-primary font-bold">
                  <HugeiconsIcon icon={Coins01Icon} size={13} />
                  {job.salary}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground ml-auto">
                  <HugeiconsIcon icon={UserCheck01Icon} size={13} className="text-info" />
                  {applicants.filter((a) => a.jobId === job.id).length} Applicants
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleDuplicateJob(job)}
                  className="px-2.5 py-1 rounded-lg bg-muted hover:bg-hover text-muted-foreground text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={12} />
                  <span>Duplicate</span>
                </button>

                {job.status === "Active" && (
                  <button
                    type="button"
                    onClick={() => handleCloseJob(job.id)}
                    className="px-2.5 py-1 rounded-lg bg-warning/15 border border-warning/30 text-warning hover:bg-warning/25 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Close Job
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleArchiveJob(job.id)}
                  className="px-2.5 py-1 rounded-lg bg-danger/15 border border-danger/30 text-danger hover:bg-danger/25 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <HugeiconsIcon icon={ArchiveIcon} size={12} />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: APPLICANT TRACKING SYSTEM (ATS) PIPELINE */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={UserCheck01Icon} size={18} className="text-info" />
            <span>Applicant Pipeline & Automated Hiring ({filteredApplicants.length})</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedJobIdFilter}
              onChange={(e) => setSelectedJobIdFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
            >
              <option value="All">All Job Postings</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
            >
              <option value="All">All Pipeline Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Applicants Roster */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-elevated text-muted-foreground font-bold text-[11px]">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Applied Job Position</th>
                  <th className="p-4">Resume & Cover Letter</th>
                  <th className="p-4">Pipeline Status</th>
                  <th className="p-4 text-right">Automated Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredApplicants.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-hover">
                    <td className="p-4">
                      <div className="font-bold text-foreground text-xs">
                        {app.firstName} {app.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{app.email}</div>
                      <div className="text-[10px] text-muted-foreground">{app.phone || "No phone provided"}</div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="font-semibold text-primary text-xs line-clamp-1">
                        {app.jobTitle}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Applied: {app.appliedAt}</div>
                    </td>

                    <td className="p-4">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-info hover:underline flex items-center gap-1"
                      >
                        <span>View Resume PDF</span>
                      </a>
                      {app.coverLetter && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1 italic max-w-xs mt-0.5">
                          &ldquo;{app.coverLetter}&rdquo;
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          app.status === "Hired"
                            ? "bg-primary-subtle text-primary border-primary/20"
                            : app.status === "Offer"
                            ? "bg-info/10 text-info border-info/20"
                            : app.status === "Interview"
                            ? "bg-accent-subtle text-accent border-accent/20"
                            : app.status === "Rejected"
                            ? "bg-danger/10 text-danger border-danger/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.status !== "Hired" && app.status !== "Rejected" && (
                          <>
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleMoveStage(app.id, e.target.value as ApplicationPipelineStatus)
                              }
                              className="h-8 px-2 rounded-lg bg-muted text-foreground text-[11px] font-semibold border border-border focus:outline-none cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>
                                  Stage: {s}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleHireApplicant(app)}
                              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-[11px] font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <HugeiconsIcon icon={UserAdd01Icon} size={14} />
                              <span>Hire Applicant</span>
                            </button>
                          </>
                        )}

                        {app.status === "Hired" && (
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-lg bg-primary-subtle text-primary font-extrabold text-[10px]">
                              ✓ Converted to Staff Automatically
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE JOB MODAL */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-elevated border border-border rounded-3xl p-6 shadow-2xl space-y-4 relative text-foreground max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <HugeiconsIcon icon={Briefcase01Icon} size={18} className="text-primary" />
                Create Career Job Posting
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateJobModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="text-muted-foreground font-bold block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as StaffDepartment)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lagos, Nigeria (Hybrid)"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground font-bold block mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="₦1,500,000 - ₦2,000,000"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground font-bold block mb-1">Job Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline key responsibilities and mission..."
                  className="w-full p-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground font-bold block mb-1">Requirements (One per line)</label>
                <textarea
                  rows={3}
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  placeholder="5+ years experience&#10;TypeScript expertise&#10;PostgreSQL knowledge"
                  className="w-full p-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground font-bold block mb-1">Benefits (One per line)</label>
                <textarea
                  rows={2}
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  placeholder="Health Insurance&#10;USD Salary Option&#10;Remote Work"
                  className="w-full p-3 rounded-xl bg-card border border-border focus:border-primary text-foreground text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground font-bold block mb-1">Closing Date</label>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-card border border-border text-foreground text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateJobModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-hover text-muted-foreground font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-colors cursor-pointer shadow-lg"
                >
                  Publish Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTOMATED HIRE SUCCESS MODAL */}
      {showHireSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-elevated border border-primary/40 rounded-3xl p-6 shadow-2xl space-y-4 relative text-foreground">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center border border-primary/30">
                <HugeiconsIcon icon={Tick02Icon} size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Applicant Hired & Provisioned!</h3>
                <p className="text-xs text-primary font-semibold">
                  Staff record created automatically with zero manual steps.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee Name:</span>
                <span className="font-bold text-foreground">
                  {showHireSuccessModal.applicant.firstName} {showHireSuccessModal.applicant.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Email:</span>
                <span className="font-mono text-foreground">{showHireSuccessModal.applicant.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temporary PIN Issued:</span>
                <span className="font-mono text-primary font-bold flex items-center gap-1">
                  <HugeiconsIcon icon={LockKeyIcon} size={14} />
                  {showHireSuccessModal.staffPin}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Staff Portal Target:</span>
                <span className="font-bold text-info">/lex/staff</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-primary-subtle border border-primary/20 text-[11px] text-muted-foreground space-y-1">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <HugeiconsIcon icon={Mail01Icon} size={14} />
                <span>Automated Welcome Email Dispatched</span>
              </div>
              <p>
                A welcome onboarding email with login instructions and temporary PIN ({showHireSuccessModal.staffPin}) has been sent to {showHireSuccessModal.applicant.email}.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHireSuccessModal(null)}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-colors cursor-pointer shadow-lg"
              >
                Close & Return to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
