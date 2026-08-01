/**
 * AchievementEngine — milestones from existing stats + profile.
 */

import type {
  PassportAchievement,
  PassportBuildInput,
} from "@/lib/trust/passport/types";

export function buildPassportAchievements(
  input: PassportBuildInput,
): PassportAchievement[] {
  const { stats, profile, identity } = input;
  const items: Array<{
    code: string;
    label: string;
    description: string;
    earned: boolean;
  }> = [
    {
      code: "assignments_100",
      label: "100 Assignments Completed",
      description: "Completed at least 100 assignments",
      earned: stats.assignmentsCompleted >= 100,
    },
    {
      code: "assignments_25",
      label: "25 Assignments Completed",
      description: "Completed at least 25 assignments",
      earned: stats.assignmentsCompleted >= 25,
    },
    {
      code: "months_12",
      label: "12 Months Active",
      description: "Member for a year or more",
      earned: stats.accountAgeDays >= 365,
    },
    {
      code: "zero_fraud",
      label: "Zero Fraud Incidents",
      description: "Clean behavior record",
      earned: stats.fraudConfirmedCount === 0 && profile.dimensions.behavior >= 95,
    },
    {
      code: "top_approval",
      label: "Top 10% Approval Rate",
      description: "Approval rate at or above 95%",
      earned: stats.approvalRate >= 0.95 && stats.assignmentsCompleted >= 10,
    },
    {
      code: "verified_identity",
      label: "Verified Identity",
      description: "Identity verification complete",
      earned:
        identity.emailVerified &&
        identity.phoneVerified &&
        (identity.governmentIdVerified || identity.organizationVerified),
    },
    {
      code: "orgs_15",
      label: "Trusted by 15 Organizations",
      description: "Worked with or endorsed by many organizations",
      earned:
        stats.distinctOrganizations >= 15 ||
        stats.organizationEndorsements >= 15,
    },
    {
      code: "orgs_5",
      label: "Multi-Organization Experience",
      description: "Active across multiple organizations",
      earned: stats.distinctOrganizations >= 5,
    },
  ];

  return items.map((i) => ({
    code: i.code,
    label: i.label,
    description: i.description,
    earned: i.earned,
  }));
}
