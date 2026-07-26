/**
 * Operational playbooks — guidance attached to queues (not auto-executed).
 */

import type {
  OperationalQueueKey,
  PlaybookKey,
} from "@/constants/operations";
import { PLAYBOOK_KEYS } from "@/constants/operations";

export type PlaybookStep = {
  order: number;
  title: string;
  actionHint: string;
};

export type OperationalPlaybookDefinition = {
  key: PlaybookKey;
  title: string;
  queueKey: OperationalQueueKey;
  summary: string;
  steps: readonly PlaybookStep[];
};

export const BUILTIN_PLAYBOOKS: readonly OperationalPlaybookDefinition[] = [
  {
    key: "notification_failure",
    title: "Notification Failure Playbook",
    queueKey: "notification",
    summary: "Retry → inspect adapter → switch provider → escalate.",
    steps: [
      { order: 1, title: "Retry delivery", actionHint: "retry" },
      { order: 2, title: "Inspect channel adapter", actionHint: "inspect" },
      { order: 3, title: "Switch provider if needed", actionHint: "requeue" },
      { order: 4, title: "Escalate to operations", actionHint: "escalate" },
    ],
  },
  {
    key: "withdrawal_failure",
    title: "Withdrawal Failure Playbook",
    queueKey: "withdrawal",
    summary: "Verify ledger → inspect batch → retry → manual review.",
    steps: [
      { order: 1, title: "Verify ledger reservation", actionHint: "inspect" },
      { order: 2, title: "Inspect withdrawal batch", actionHint: "inspect" },
      { order: 3, title: "Retry or cancel request", actionHint: "retry" },
      { order: 4, title: "Manual finance review", actionHint: "escalate" },
    ],
  },
  {
    key: "payment_failure",
    title: "Payment Failure Playbook",
    queueKey: "payment",
    summary: "Verify webhook → check provider → replay event → escalate.",
    steps: [
      { order: 1, title: "Verify webhook / signature", actionHint: "inspect" },
      {
        order: 2,
        title: "Check provider response snapshot",
        actionHint: "inspect",
      },
      {
        order: 3,
        title: "Replay normalized payment event",
        actionHint: "retry",
      },
      { order: 4, title: "Escalate finance", actionHint: "escalate" },
    ],
  },
  {
    key: "review_sla",
    title: "Review SLA Playbook",
    queueKey: "review",
    summary: "Notify reviewer → reassign → escalate to senior reviewer.",
    steps: [
      { order: 1, title: "Notify assigned reviewer", actionHint: "retry" },
      { order: 2, title: "Reassign queue item", actionHint: "requeue" },
      {
        order: 3,
        title: "Escalate to senior reviewer",
        actionHint: "escalate",
      },
    ],
  },
];

export function getPlaybook(
  key: PlaybookKey,
): OperationalPlaybookDefinition | null {
  return BUILTIN_PLAYBOOKS.find((p) => p.key === key) ?? null;
}

export function playbooksForQueue(
  queueKey: OperationalQueueKey,
): OperationalPlaybookDefinition[] {
  return BUILTIN_PLAYBOOKS.filter((p) => p.queueKey === queueKey);
}

export function isPlaybookKey(value: string): value is PlaybookKey {
  return (PLAYBOOK_KEYS as readonly string[]).includes(value);
}
