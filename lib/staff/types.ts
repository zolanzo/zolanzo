export type StaffDepartment =
  | "Support"
  | "Finance"
  | "Moderation"
  | "Operations"
  | "Marketing"
  | "Engineering"
  | "Growth"
  | "Compliance"
  | "Customer Success";

export type StaffRole =
  | "Support Agent"
  | "Moderator"
  | "Finance Officer"
  | "Developer"
  | "Manager"
  | "Administrator"
  | "Viewer";

export type EmploymentStatus =
  | "Active"
  | "Onboarding"
  | "Suspended"
  | "Disabled"
  | "Archived";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: StaffDepartment;
  role: StaffRole;
  manager: string;
  status: EmploymentStatus;
  tempPin: string;
  mustChangePinOnLogin: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  userEmail: string;
  userRole: "worker" | "employer";
  priority: "High" | "Normal" | "Urgent";
  status: "Open" | "In Progress" | "Resolved";
  assignedTo: string;
  createdAt: string;
}

export interface ModerationItem {
  id: string;
  title: string;
  type: "Campaign Brief" | "Worker Submission" | "KYC Verification";
  submittedBy: string;
  riskScore: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: string;
}
