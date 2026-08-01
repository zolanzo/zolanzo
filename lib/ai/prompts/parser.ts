/**
 * Structured JSON response parser for AI outputs.
 */

import type { AiStructuredJson } from "@/lib/ai/types";

export function parseStructuredJson(text: string): AiStructuredJson | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Prefer fenced JSON blocks
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? trimmed;

  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as AiStructuredJson;
    }
    return { value: parsed as never };
  } catch {
    // Attempt to extract first {...} object
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const sliced = candidate.slice(start, end + 1);
        const parsed = JSON.parse(sliced) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as AiStructuredJson;
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}
