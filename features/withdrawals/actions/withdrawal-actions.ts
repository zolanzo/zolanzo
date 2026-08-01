"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { requirePermission } from "@/lib/rbac/guards";
import {
  cancelWithdrawal,
  confirmWithdrawalIntent,
  createWithdrawalIntent,
  processWithdrawal,
  processWithdrawalBatch,
  recordWithdrawalApproval,
  upsertDestinationAccount,
  type WithdrawalIntentView,
  type WithdrawalRequestRecord,
} from "@/features/withdrawals/services/withdrawal-service";

export async function upsertDestinationAccountAction(
  input: unknown,
): Promise<
  ApiResponse<{
    id: string;
    kind: string;
    label: string;
    verified: boolean;
  }>
> {
  const ctx = await requirePermission("withdrawals.request");
  return upsertDestinationAccount({
    input,
    workerUserId: ctx.user.id,
  });
}

export async function createWithdrawalIntentAction(
  input: unknown,
): Promise<ApiResponse<WithdrawalIntentView>> {
  const ctx = await requirePermission("withdrawals.request");
  return createWithdrawalIntent({
    input,
    workerUserId: ctx.user.id,
  });
}

export async function confirmWithdrawalIntentAction(
  input: unknown,
): Promise<ApiResponse<WithdrawalRequestRecord>> {
  const ctx = await requirePermission("withdrawals.request");
  return confirmWithdrawalIntent({
    input,
    workerUserId: ctx.user.id,
  });
}

export async function recordWithdrawalApprovalAction(
  input: unknown,
): Promise<ApiResponse<WithdrawalRequestRecord>> {
  const ctx = await requirePermission("withdrawals.approve");
  return recordWithdrawalApproval({
    input,
    approverUserId: ctx.user.id,
  });
}

export async function processWithdrawalAction(
  withdrawalPublicId: string,
): Promise<ApiResponse<WithdrawalRequestRecord>> {
  await requirePermission("withdrawals.approve");
  return processWithdrawal({ input: { withdrawalPublicId } });
}

export async function cancelWithdrawalAction(
  withdrawalPublicId: string,
): Promise<ApiResponse<WithdrawalRequestRecord>> {
  const ctx = await requireAuthContext();
  return cancelWithdrawal({
    input: { withdrawalPublicId },
    workerUserId: ctx.user.id,
  });
}

export async function processWithdrawalBatchAction(
  batchPublicId: string,
): Promise<
  ApiResponse<{
    batchPublicId: string;
    status: string;
    processed: number;
    failed: number;
  }>
> {
  await requirePermission("withdrawals.approve");
  return processWithdrawalBatch({ input: { batchPublicId } });
}
