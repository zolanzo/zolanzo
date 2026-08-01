/**
 * BadgeEngine — derive passport badges from TrustProfile + signals.
 * Never recalculates trust scores.
 */

import { isTrustBadgesEnabled } from "@/lib/trust/passport/config";
import type {
  PassportBadge,
  PassportBuildInput,
} from "@/lib/trust/passport/types";

const CATALOG: Array<{
  code: PassportBadge["code"];
  label: string;
  description: string;
  visibility: PassportBadge["visibility"];
  earned: (input: PassportBuildInput) => boolean;
}> = [
  {
    code: "verified_email",
    label: "Verified Email",
    description: "Email address confirmed",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.identity.emailVerified,
  },
  {
    code: "verified_phone",
    label: "Verified Phone",
    description: "Phone number confirmed",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.identity.phoneVerified,
  },
  {
    code: "verified_identity",
    label: "Verified Identity",
    description: "Government ID or KYC verified",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.identity.governmentIdVerified,
  },
  {
    code: "trusted_worker",
    label: "Trusted Worker",
    description: "Overall trust in the Trusted band or higher",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.profile.overallScore >= 75,
  },
  {
    code: "reliable_contributor",
    label: "Reliable Contributor",
    description: "Strong reliability dimension",
    visibility: ["private", "organization"],
    earned: (i) => i.profile.dimensions.reliability >= 85,
  },
  {
    code: "high_approval",
    label: "High Approval",
    description: "Approval rate at or above 95%",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.stats.approvalRate >= 0.95 && i.stats.assignmentsCompleted >= 5,
  },
  {
    code: "long_term_member",
    label: "Long-Term Member",
    description: "Active on the platform for 12+ months",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.stats.accountAgeDays >= 365,
  },
  {
    code: "zero_fraud",
    label: "Zero Fraud",
    description: "No confirmed fraud incidents",
    visibility: ["private", "organization"],
    earned: (i) =>
      i.stats.fraudConfirmedCount === 0 &&
      i.profile.dimensions.behavior >= 95,
  },
  {
    code: "organization_trusted",
    label: "Organization Trusted",
    description: "Endorsed by organizations",
    visibility: ["private", "organization", "public"],
    earned: (i) => i.stats.organizationEndorsements >= 1,
  },
];

export function buildPassportBadges(
  input: PassportBuildInput,
  enabled?: boolean,
): PassportBadge[] {
  if (!(enabled ?? isTrustBadgesEnabled())) return [];
  return CATALOG.map((b) => ({
    code: b.code,
    label: b.label,
    description: b.description,
    visibility: b.visibility,
    earned: b.earned(input),
  }));
}

/** Match Engine metadata — earned badge codes only. */
export function earnedBadgeCodes(input: PassportBuildInput): string[] {
  return buildPassportBadges(input)
    .filter((b) => b.earned)
    .map((b) => b.code);
}
