import { describe, expect, it } from "vitest";
import { getAllAuditLogs, getImpersonationSession } from "@/lib/auth/impersonation";

describe("impersonation storage", () => {
  it("does not invent sample audit logs during SSR", () => {
    expect(getImpersonationSession()).toBeNull();
    expect(getAllAuditLogs()).toEqual([]);
  });
});
