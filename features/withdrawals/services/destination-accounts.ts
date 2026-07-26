/**
 * Destination account service — bank active; others placeholders.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import {
  DESTINATION_ACCOUNT_KIND_STATUS,
  DESTINATION_ACCOUNT_KINDS,
  type DestinationAccountKind,
} from "@/constants/finance-enums";
import { z } from "zod";

export type DestinationAccountRecord = {
  id: string;
  workerUserId: string;
  organizationId: string | null;
  kind: DestinationAccountKind;
  label: string;
  currency: string;
  details: Record<string, unknown>;
  verified: boolean;
  active: boolean;
  createdAt: string;
};

const createDestinationSchema = z.object({
  kind: z.enum(DESTINATION_ACCOUNT_KINDS),
  label: z.string().min(1).max(120),
  currency: z.string().length(3),
  organizationId: z.string().min(1).optional().nullable(),
  details: z.record(z.string(), z.unknown()),
  verified: z.boolean().optional(),
});

function mapDestination(row: {
  id: string;
  workerUserId: string;
  organizationId: string | null;
  kind: string;
  label: string;
  currency: string;
  details: Prisma.JsonValue;
  verified: boolean;
  active: boolean;
  createdAt: Date;
}): DestinationAccountRecord {
  return {
    id: row.id,
    workerUserId: row.workerUserId,
    organizationId: row.organizationId,
    kind: row.kind as DestinationAccountKind,
    label: row.label,
    currency: row.currency,
    details: row.details as Record<string, unknown>,
    verified: row.verified,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createDestinationAccount(params: {
  input: unknown;
  workerUserId: string;
}): Promise<ApiResponse<DestinationAccountRecord>> {
  try {
    const parsed = createDestinationSchema.parse(params.input);
    if (DESTINATION_ACCOUNT_KIND_STATUS[parsed.kind] !== "active") {
      throw new AppError(
        "KIND_NOT_ACTIVE",
        `Destination kind ${parsed.kind} is a placeholder — only bank_account is active`,
        400,
      );
    }
    if (parsed.kind === "bank_account") {
      const bankCode = parsed.details.bankCode;
      const accountNumber = parsed.details.accountNumber;
      if (typeof bankCode !== "string" || typeof accountNumber !== "string") {
        throw new AppError(
          "INVALID_BANK_DETAILS",
          "bank_account requires details.bankCode and details.accountNumber",
          400,
        );
      }
    }

    const row = await prisma.destinationAccount.create({
      data: {
        workerUserId: params.workerUserId,
        organizationId: parsed.organizationId ?? null,
        kind: parsed.kind,
        label: parsed.label,
        currency: parsed.currency.toUpperCase(),
        details: parsed.details as Prisma.InputJsonValue,
        verified: parsed.verified ?? false,
      },
    });
    return apiSuccess(mapDestination(row));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "DESTINATION_CREATE_FAILED",
      error instanceof Error ? error.message : "Could not create destination",
    );
  }
}

export async function listDestinationAccounts(params: {
  workerUserId: string;
}): Promise<ApiResponse<DestinationAccountRecord[]>> {
  try {
    const rows = await prisma.destinationAccount.findMany({
      where: { workerUserId: params.workerUserId, active: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(rows.map(mapDestination));
  } catch (error) {
    return apiError(
      "DESTINATION_LIST_FAILED",
      error instanceof Error ? error.message : "Could not list destinations",
    );
  }
}

export async function getDestinationAccount(
  id: string,
): Promise<DestinationAccountRecord | null> {
  const row = await prisma.destinationAccount.findUnique({ where: { id } });
  return row ? mapDestination(row) : null;
}
