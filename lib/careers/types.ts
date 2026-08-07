import type { StaffDepartment } from "@/lib/staff/types";

export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Remote";
export type JobStatus = "Active" | "Draft" | "Closed" | "Archived";
export type ApplicationPipelineStatus =
  | "Applied"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Rejected";

export interface JobPosting {
  id: string;
  title: string;
  department: StaffDepartment;
  employmentType: EmploymentType;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  closingDate: string;
  status: JobStatus;
  createdAt: string;
  applicantCount: number;
}

export interface JobApplicant {
  id: string;
  jobId: string;
  jobTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  portfolioUrl?: string;
  status: ApplicationPipelineStatus;
  appliedAt: string;
  hiredAt?: string;
  generatedStaffId?: string;
  generatedTempPin?: string;
}
