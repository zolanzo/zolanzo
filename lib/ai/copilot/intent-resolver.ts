/**
 * IntentResolver — map natural-language questions (and follow-ups) to intents.
 */

import type { OrgCopilotIntent } from "@/lib/ai/copilot/org-types";

const PATTERNS: Array<{ intent: OrgCopilotIntent; patterns: RegExp[] }> = [
  {
    intent: "campaigns_behind_schedule",
    patterns: [
      /behind\s+schedule/i,
      /delayed\s+campaign/i,
      /campaigns?\s+(are\s+)?late/i,
      /overdue\s+campaign/i,
    ],
  },
  {
    intent: "top_workers",
    patterns: [
      /top[- ]?perform/i,
      /best\s+workers?/i,
      /highest\s+(performing|rated)\s+workers?/i,
      /who\s+are\s+my\s+top/i,
    ],
  },
  {
    intent: "reviewer_workload",
    patterns: [
      /reviewer\s+workload/i,
      /reviewers?\s+have\s+the\s+highest/i,
      /review\s+queue/i,
      /who\s+is\s+(reviewing|overloaded)/i,
    ],
  },
  {
    intent: "pending_payments",
    patterns: [
      /pending\s+payments?/i,
      /payments?\s+(?:are\s+)?(?:still\s+)?pending/i,
      /what\s+payments?\s+(?:are\s+)?(?:still\s+)?pending/i,
      /unpaid/i,
      /awaiting\s+payment/i,
    ],
  },
  {
    intent: "fraud_trends",
    patterns: [
      /fraud\s+risk/i,
      /rising\s+fraud/i,
      /suspicious\s+submissions?/i,
      /fraud\s+trend/i,
    ],
  },
  {
    intent: "regional_performance",
    patterns: [
      /region(al|s)?\s+(have|with)\s+the\s+lowest/i,
      /completion\s+rate.*(region|state|lga)/i,
      /which\s+regions?/i,
      /regional\s+performance/i,
    ],
  },
  {
    intent: "completion_rates",
    patterns: [
      /completion\s+rate/i,
      /how\s+complete/i,
      /completion\s+progress/i,
    ],
  },
  {
    intent: "organization_spending",
    patterns: [
      /spent\s+this\s+(quarter|month|year)/i,
      /how\s+much\s+have\s+we\s+spent/i,
      /organization\s+spending/i,
      /budget\s+spend/i,
    ],
  },
  {
    intent: "inactive_workers",
    patterns: [
      /haven'?t\s+accepted/i,
      /inactive\s+workers?/i,
      /workers?\s+not\s+accept/i,
      /no\s+recent\s+assignments?/i,
    ],
  },
  {
    intent: "highest_trust_workers",
    patterns: [
      /highest\s+trust/i,
      /most\s+trusted\s+workers?/i,
      /trust\s+score/i,
      /workers?\s+with\s+(the\s+)?highest\s+trust/i,
    ],
  },
  {
    intent: "declining_trust",
    patterns: [
      /declining\s+trust/i,
      /trust\s+(is\s+)?falling/i,
      /workers?\s+losing\s+trust/i,
      /falling\s+trust/i,
    ],
  },
  {
    intent: "recently_improved_trust",
    patterns: [
      /recently\s+improved\s+trust/i,
      /improving\s+trust/i,
      /trust\s+improved/i,
      /rising\s+trust/i,
    ],
  },
  {
    intent: "strongest_reliability",
    patterns: [
      /strongest\s+reliability/i,
      /most\s+reliable\s+workers?/i,
      /reliability\s+score/i,
      /best\s+reliability/i,
    ],
  },
  {
    intent: "assignment_backlog",
    patterns: [
      /assignment\s+backlog/i,
      /unclaimed\s+(tasks?|work)/i,
      /open\s+assignments?/i,
      /backlog/i,
    ],
  },
  {
    intent: "campaign_performance",
    patterns: [
      /campaign\s+performance/i,
      /how\s+are\s+(my\s+)?campaigns?/i,
      /campaign\s+status/i,
      /campaign\s+progress/i,
    ],
  },
];

const FOLLOW_UP = /^(why|how|show\s+(me\s+)?(them|those|affected|more)|explain|details?|what\s+about)\b/i;

export function resolveOrgCopilotIntent(params: {
  question: string;
  previousIntent?: OrgCopilotIntent | null;
}): { intent: OrgCopilotIntent; isFollowUp: boolean } {
  const q = params.question.trim();
  if (!q) return { intent: "unknown", isFollowUp: false };

  if (FOLLOW_UP.test(q) && params.previousIntent && params.previousIntent !== "unknown") {
    if (/show\s+(me\s+)?(affected\s+)?workers?/i.test(q)) {
      return { intent: "inactive_workers", isFollowUp: true };
    }
    if (/show\s+(me\s+)?(affected\s+)?campaigns?/i.test(q)) {
      return { intent: "campaigns_behind_schedule", isFollowUp: true };
    }
    return { intent: params.previousIntent, isFollowUp: true };
  }

  for (const entry of PATTERNS) {
    if (entry.patterns.some((p) => p.test(q))) {
      return { intent: entry.intent, isFollowUp: false };
    }
  }

  return { intent: "unknown", isFollowUp: false };
}
