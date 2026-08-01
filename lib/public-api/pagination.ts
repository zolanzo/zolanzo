/**
 * Cursor-based pagination helpers.
 */

export type CursorPageInput = {
  cursor?: string | null;
  limit?: number;
};

export function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export function paginateArray<T>(
  items: T[],
  input?: CursorPageInput,
): {
  data: T[];
  page: { nextCursor: string | null; hasMore: boolean };
} {
  const limit = Math.min(Math.max(input?.limit ?? 20, 1), 100);
  const offset = decodeCursor(input?.cursor);
  const slice = items.slice(offset, offset + limit);
  const nextOffset = offset + slice.length;
  const hasMore = nextOffset < items.length;
  return {
    data: slice,
    page: {
      nextCursor: hasMore ? encodeCursor(nextOffset) : null,
      hasMore,
    },
  };
}
