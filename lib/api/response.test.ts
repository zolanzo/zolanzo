import { describe, expect, it } from "vitest";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";

describe("api responses", () => {
  it("builds success payloads", () => {
    expect(apiSuccess({ ping: true })).toEqual({
      ok: true,
      data: { ping: true },
    });
  });

  it("builds structured errors", () => {
    expect(apiError("X", "msg")).toEqual({
      ok: false,
      error: { code: "X", message: "msg" },
    });
  });

  it("maps AppError to API error", () => {
    const err = new AppError("FORBIDDEN", "Nope", 403);
    expect(err.toApiError().error.code).toBe("FORBIDDEN");
    expect(err.status).toBe(403);
  });
});
