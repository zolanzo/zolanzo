/**
 * Public ID catalog — human-friendly identifiers for support, email, audit.
 * Internal DB ids (cuid) remain primary keys; public IDs are stable external refs.
 */

export const PUBLIC_ID_ENTITIES = [
  "organization",
  "client",
  "worker",
  "campaign",
  "task_template",
  "task",
  "assignment",
  "submission",
  "validation_report",
  "review_decision",
  "settlement",
  "settlement_batch",
  "escrow_snapshot",
  "wallet",
  "transaction",
  "withdrawal",
  "withdrawal_batch",
  "payment",
  "notification",
  "operation",
  "playbook",
  "ai_execution",
  "ai_decision",
  "dispute",
] as const;

export type PublicIdEntity = (typeof PUBLIC_ID_ENTITIES)[number];

export type PublicIdStrategy =
  | "random"
  | "sequential"
  | "year_sequential"
  | "date_sequential";

export type PublicIdDefinition = {
  entity: PublicIdEntity;
  prefix: string;
  strategy: PublicIdStrategy;
  /** Random segment length (excluding prefix) */
  randomLength?: number;
  /** Zero-padded width for sequential portion */
  sequenceWidth?: number;
  example: string;
};

/**
 * Canonical formats. All modules must use `generatePublicId` — never invent formats.
 */
export const PUBLIC_ID_DEFINITIONS: Record<PublicIdEntity, PublicIdDefinition> =
  {
    organization: {
      entity: "organization",
      prefix: "ORG",
      strategy: "random",
      randomLength: 6,
      example: "ORG-9X4P2M",
    },
    client: {
      entity: "client",
      prefix: "CLI",
      strategy: "random",
      randomLength: 6,
      example: "CLI-8D71KF",
    },
    worker: {
      entity: "worker",
      prefix: "WRK",
      strategy: "random",
      randomLength: 6,
      example: "WRK-3L8NQ2",
    },
    campaign: {
      entity: "campaign",
      prefix: "CMP",
      strategy: "year_sequential",
      sequenceWidth: 6,
      example: "CMP-2026-000001",
    },
    task_template: {
      entity: "task_template",
      prefix: "TPL",
      strategy: "sequential",
      sequenceWidth: 6,
      example: "TPL-000127",
    },
    task: {
      entity: "task",
      prefix: "TSK",
      strategy: "random",
      randomLength: 6,
      example: "TSK-8A92KD",
    },
    assignment: {
      entity: "assignment",
      prefix: "ASN",
      strategy: "random",
      randomLength: 6,
      example: "ASN-24H7QK",
    },
    submission: {
      entity: "submission",
      prefix: "SUB",
      strategy: "random",
      randomLength: 6,
      example: "SUB-6P2RM8",
    },
    validation_report: {
      entity: "validation_report",
      prefix: "VAL",
      strategy: "random",
      randomLength: 6,
      example: "VAL-4K7N2P",
    },
    review_decision: {
      entity: "review_decision",
      prefix: "REV",
      strategy: "random",
      randomLength: 6,
      example: "REV-8M3Q2K",
    },
    settlement: {
      entity: "settlement",
      prefix: "SET",
      strategy: "random",
      randomLength: 6,
      example: "SET-7H2N9K",
    },
    settlement_batch: {
      entity: "settlement_batch",
      prefix: "BAT",
      strategy: "random",
      randomLength: 6,
      example: "BAT-3P8Q2M",
    },
    escrow_snapshot: {
      entity: "escrow_snapshot",
      prefix: "ESC",
      strategy: "random",
      randomLength: 6,
      example: "ESC-5K9N2R",
    },
    wallet: {
      entity: "wallet",
      prefix: "WAL",
      strategy: "sequential",
      sequenceWidth: 6,
      example: "WAL-000045",
    },
    transaction: {
      entity: "transaction",
      prefix: "TXN",
      strategy: "date_sequential",
      sequenceWidth: 6,
      example: "TXN-20260725-000014",
    },
    withdrawal: {
      entity: "withdrawal",
      prefix: "WDR",
      strategy: "sequential",
      sequenceWidth: 6,
      example: "WDR-000832",
    },
    withdrawal_batch: {
      entity: "withdrawal_batch",
      prefix: "BATW",
      strategy: "random",
      randomLength: 6,
      example: "BATW-4K8N2P",
    },
    payment: {
      entity: "payment",
      prefix: "PAY",
      strategy: "random",
      randomLength: 6,
      example: "PAY-6N2K8M",
    },
    notification: {
      entity: "notification",
      prefix: "NTF",
      strategy: "random",
      randomLength: 6,
      example: "NTF-4K8N2P",
    },
    operation: {
      entity: "operation",
      prefix: "OPC",
      strategy: "random",
      randomLength: 6,
      example: "OPC-7H2N9K",
    },
    playbook: {
      entity: "playbook",
      prefix: "PBK",
      strategy: "sequential",
      sequenceWidth: 6,
      example: "PBK-000014",
    },
    ai_execution: {
      entity: "ai_execution",
      prefix: "AIX",
      strategy: "random",
      randomLength: 6,
      example: "AIX-5K9N2R",
    },
    ai_decision: {
      entity: "ai_decision",
      prefix: "DEC",
      strategy: "random",
      randomLength: 6,
      example: "DEC-3P8Q2M",
    },
    dispute: {
      entity: "dispute",
      prefix: "DSP",
      strategy: "sequential",
      sequenceWidth: 6,
      example: "DSP-000041",
    },
  };

/** Crockford-ish alphabet — no 0/O/1/I/L ambiguity */
export const PUBLIC_ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ" as const;

export const PUBLIC_ID_REGEX: Record<PublicIdEntity, RegExp> = {
  organization: /^ORG-[2-9A-HJ-NP-Z]{6}$/,
  client: /^CLI-[2-9A-HJ-NP-Z]{6}$/,
  worker: /^WRK-[2-9A-HJ-NP-Z]{6}$/,
  campaign: /^CMP-\d{4}-\d{6}$/,
  task_template: /^TPL-\d{6}$/,
  task: /^TSK-[2-9A-HJ-NP-Z]{6}$/,
  assignment: /^ASN-[2-9A-HJ-NP-Z]{6}$/,
  submission: /^SUB-[2-9A-HJ-NP-Z]{6}$/,
  validation_report: /^VAL-[2-9A-HJ-NP-Z]{6}$/,
  review_decision: /^REV-[2-9A-HJ-NP-Z]{6}$/,
  settlement: /^SET-[2-9A-HJ-NP-Z]{6}$/,
  settlement_batch: /^BAT-[2-9A-HJ-NP-Z]{6}$/,
  escrow_snapshot: /^ESC-[2-9A-HJ-NP-Z]{6}$/,
  wallet: /^WAL-\d{6}$/,
  transaction: /^TXN-\d{8}-\d{6}$/,
  withdrawal: /^WDR-\d{6}$/,
  withdrawal_batch: /^BATW-[2-9A-HJ-NP-Z]{6}$/,
  payment: /^PAY-[2-9A-HJ-NP-Z]{6}$/,
  notification: /^NTF-[2-9A-HJ-NP-Z]{6}$/,
  operation: /^OPC-[2-9A-HJ-NP-Z]{6}$/,
  playbook: /^PBK-\d{6}$/,
  ai_execution: /^AIX-[2-9A-HJ-NP-Z]{6}$/,
  ai_decision: /^DEC-[2-9A-HJ-NP-Z]{6}$/,
  dispute: /^DSP-\d{6}$/,
};
