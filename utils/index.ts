import { twMerge } from "tailwind-merge";

/**
 * ClassName merger that keeps the last conflicting Tailwind utility.
 * Callers pass later theme/layout classes to override defaults.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}

/**
 * Formats byte sizes for reports and admin UIs.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Narrow unknown errors to a message string.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
