"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import type {
  ValidationReportPackage,
  ValidationReportRecord,
} from "@/features/verification/types";
import {
  getValidationReport,
  listValidationReports,
  runValidation,
} from "@/features/verification/services/validation-service";

export async function runValidationAction(
  input: unknown,
): Promise<ApiResponse<ValidationReportPackage>> {
  await requireAuthContext();
  return runValidation({ input });
}

export async function getValidationReportAction(
  reportPublicId: string,
): Promise<ApiResponse<ValidationReportPackage>> {
  await requireAuthContext();
  return getValidationReport({ input: { reportPublicId } });
}

export async function listValidationReportsAction(
  submissionPublicId: string,
): Promise<ApiResponse<ValidationReportRecord[]>> {
  await requireAuthContext();
  return listValidationReports({ input: { submissionPublicId } });
}
