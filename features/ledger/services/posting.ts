import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { FinancialTransactionType } from "@/constants/transaction-types";
import { getJournalTemplate } from "@/constants/journal-templates";
import { generatePublicId } from "@/lib/public-id/generator";
import { AppError } from "@/lib/api/response";
import {
  assertBalancedJournal,
  expandTemplateLines,
  type LedgerLineInput,
} from "@/features/ledger/services/integrity";
import { BaseRepository } from "@/repositories/base";

export type PostedJournal = {
  transactionId: string;
  transactionPublicId: string;
  journalId: string;
  lines: LedgerLineInput[];
};

class LedgerRepository extends BaseRepository {
  async findTransactionByIdempotencyKey(key: string): Promise<{
    id: string;
    publicId: string;
    status: string;
  } | null> {
    const row = await prisma.financialTransaction.findUnique({
      where: { idempotencyKey: key },
      select: { id: true, publicId: true, status: true },
    });
    return row;
  }

  async listEntriesForWallet(walletId: string): Promise<
    Array<{
      accountCode: string;
      side: string;
      amountMinor: number;
      status: string;
    }>
  > {
    return prisma.ledgerEntry.findMany({
      where: { walletId, status: "completed" },
      select: {
        accountCode: true,
        side: true,
        amountMinor: true,
        status: true,
      },
    });
  }

  async postTransaction(params: {
    type: FinancialTransactionType;
    amountMinor: number;
    feeMinor: number;
    netMinor: number;
    currency: string;
    idempotencyKey: string;
    memo?: string | null;
    campaignId?: string | null;
    assignmentId?: string | null;
    submissionId?: string | null;
    reviewDecisionId?: string | null;
    settlementId?: string | null;
    organizationId?: string | null;
    sourceWalletId?: string | null;
    destinationWalletId?: string | null;
    workerWalletId?: string | null;
    metadata?: Record<string, unknown> | null;
    lines?: LedgerLineInput[];
  }): Promise<PostedJournal> {
    const existing = await this.findTransactionByIdempotencyKey(
      params.idempotencyKey,
    );
    if (existing) {
      const journal = await prisma.ledgerJournal.findUnique({
        where: { transactionId: existing.id },
        include: { entries: true },
      });
      if (!journal) {
        throw new AppError("IDEMPOTENT_INCOMPLETE", "Prior TXN missing journal", 500);
      }
      return {
        transactionId: existing.id,
        transactionPublicId: existing.publicId,
        journalId: journal.id,
        lines: journal.entries.map((e) => ({
          accountCode: e.accountCode,
          side: e.side as "debit" | "credit",
          amountMinor: e.amountMinor,
          walletId: e.walletId,
        })),
      };
    }

    const template = getJournalTemplate(params.type);
    const lines =
      params.lines ??
      (template
        ? expandTemplateLines({
            lines: template.lines,
            amountMinor: params.amountMinor,
            feeMinor: params.feeMinor,
            netMinor: params.netMinor,
            workerWalletId: params.workerWalletId,
          })
        : []);

    assertBalancedJournal(lines);

    const publicId = await generatePublicId("transaction");

    const created = await prisma.$transaction(async (tx) => {
      const txn = await tx.financialTransaction.create({
        data: {
          publicId,
          type: params.type,
          status: "completed",
          amountMinor: params.amountMinor,
          feeMinor: params.feeMinor,
          netMinor: params.netMinor,
          currency: params.currency,
          idempotencyKey: params.idempotencyKey,
          campaignId: params.campaignId ?? null,
          assignmentId: params.assignmentId ?? null,
          submissionId: params.submissionId ?? null,
          reviewDecisionId: params.reviewDecisionId ?? null,
          settlementId: params.settlementId ?? null,
          organizationId: params.organizationId ?? null,
          sourceWalletId: params.sourceWalletId ?? null,
          destinationWalletId: params.destinationWalletId ?? null,
          metadata: (params.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          completedAt: new Date(),
        },
      });

      const journal = await tx.ledgerJournal.create({
        data: {
          transactionId: txn.id,
          idempotencyKey: `journal:${params.idempotencyKey}`,
          transactionType: params.type,
          status: "posted",
          currency: params.currency,
          memo: params.memo ?? null,
          postedAt: new Date(),
          entries: {
            create: lines.map((line) => ({
              accountCode: line.accountCode,
              walletId: line.walletId ?? null,
              side: line.side,
              amountMinor: line.amountMinor,
              currency: params.currency,
              status: "completed",
            })),
          },
        },
      });

      return { txn, journal };
    });

    return {
      transactionId: created.txn.id,
      transactionPublicId: created.txn.publicId,
      journalId: created.journal.id,
      lines,
    };
  }
}

export const ledgerRepository = new LedgerRepository();

export async function postLedgerTransaction(
  params: Parameters<LedgerRepository["postTransaction"]>[0],
): Promise<PostedJournal> {
  return ledgerRepository.postTransaction(params);
}
