/**
 * WorkerIntentResolver — map worker questions / follow-ups to intents.
 */

import type { WorkerCopilotIntent } from "@/lib/ai/copilot/worker-types";

const PATTERNS: Array<{ intent: WorkerCopilotIntent; patterns: RegExp[] }> = [
  {
    intent: "next_best_task",
    patterns: [
      /what\s+(assignment|task)\s+should\s+i\s+(complete|do)\s+first/i,
      /what\s+should\s+i\s+do\s+next/i,
      /next\s+best\s+(task|assignment)/i,
      /priorit(y|ise|ize)/i,
    ],
  },
  {
    intent: "highest_pay_today",
    patterns: [
      /pays?\s+the\s+most/i,
      /highest\s+(pay|payout|reward)/i,
      /best\s+paying/i,
    ],
  },
  {
    intent: "nearby_work",
    patterns: [/nearby/i, /close\s+to\s+me/i, /jobs?\s+near/i, /near\s+me/i],
  },
  {
    intent: "deadlines",
    patterns: [
      /expir(e|es|ing)\s+soon/i,
      /deadline/i,
      /time\s+remaining/i,
      /due\s+soon/i,
    ],
  },
  {
    intent: "missing_evidence",
    patterns: [
      /evidence\s+(is\s+)?(still\s+)?missing/i,
      /missing\s+(evidence|photo|document)/i,
      /what\s+(files?|photos?)\s+(do\s+i\s+)?(still\s+)?need/i,
    ],
  },
  {
    intent: "rejection_reason",
    patterns: [
      /why\s+(was|were)\s+(my|the)\s+.*(reject|revision)/i,
      /previous\s+submission\s+rejected/i,
      /why\s+rejected/i,
    ],
  },
  {
    intent: "submission_status",
    patterns: [
      /submission\s+status/i,
      /status\s+of\s+my\s+submission/i,
      /is\s+my\s+submission/i,
    ],
  },
  {
    intent: "approval_history",
    patterns: [
      /approval\s+(rate|history)/i,
      /how\s+can\s+i\s+improve\s+my\s+approval/i,
      /approval\s+probability/i,
    ],
  },
  {
    intent: "trust_score",
    patterns: [/trust\s+score/i, /my\s+trust/i, /reputation/i],
  },
  {
    intent: "weekly_earnings",
    patterns: [
      /earned\s+this\s+week/i,
      /how\s+much\s+have\s+i\s+earned/i,
      /weekly\s+earnings/i,
      /my\s+earnings/i,
    ],
  },
  {
    intent: "payment_history",
    patterns: [/payment\s+history/i, /my\s+payments/i, /when\s+(do\s+i|will\s+i)\s+get\s+paid/i],
  },
  {
    intent: "assignment_coach",
    patterns: [
      /assignment\s+coach/i,
      /ready\s+to\s+submit/i,
      /checklist\s+for\s+(this\s+)?assignment/i,
      /help\s+(me\s+)?(with\s+)?(this\s+)?assignment/i,
      /common\s+mistakes/i,
    ],
  },
  {
    intent: "progress",
    patterns: [
      /am\s+i\s+close\s+to\s+completing/i,
      /my\s+progress/i,
      /assignments?\s+completed/i,
      /progress\s+coach/i,
    ],
  },
  {
    intent: "improvement_tips",
    patterns: [
      /improve\s+my\s+(approval|trust)/i,
      /how\s+can\s+i\s+improve\s+(my\s+)?trust/i,
      /suggested\s+improvements?/i,
      /how\s+can\s+i\s+improve/i,
      /tips?\s+to\s+(get\s+)?approved/i,
      /events?\s+(that\s+)?lowered\s+(my\s+)?(score|trust)/i,
      /why\s+did\s+my\s+trust/i,
    ],
  },
  {
    intent: "my_assignments",
    patterns: [
      /my\s+assignments?/i,
      /what\s+assignments?\s+do\s+i\s+have/i,
      /list\s+my\s+(tasks?|assignments?)/i,
    ],
  },
];

const FOLLOW_UP =
  /^(why|how|show\s+(me\s+)?(nearby|those|them|more)|what\s+pays\s+more|which\s+one\s+finishes\s+fastest|explain|details?)\b/i;

export function resolveWorkerCopilotIntent(params: {
  question: string;
  previousIntent?: WorkerCopilotIntent | null;
}): { intent: WorkerCopilotIntent; isFollowUp: boolean } {
  const q = params.question.trim();
  if (!q) return { intent: "unknown", isFollowUp: false };

  if (
    FOLLOW_UP.test(q) &&
    params.previousIntent &&
    params.previousIntent !== "unknown"
  ) {
    if (/nearby/i.test(q)) return { intent: "nearby_work", isFollowUp: true };
    if (/pays?\s+more/i.test(q))
      return { intent: "highest_pay_today", isFollowUp: true };
    if (/finishes?\s+fastest/i.test(q))
      return { intent: "next_best_task", isFollowUp: true };
    return { intent: params.previousIntent, isFollowUp: true };
  }

  for (const entry of PATTERNS) {
    if (entry.patterns.some((p) => p.test(q))) {
      return { intent: entry.intent, isFollowUp: false };
    }
  }

  return { intent: "unknown", isFollowUp: false };
}
