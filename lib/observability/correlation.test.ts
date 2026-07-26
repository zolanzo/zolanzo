import { describe, expect, it } from "vitest";
import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
  generateCorrelationId,
  isValidCorrelationId,
  resolveCorrelationId,
  resolveRequestId,
} from "@/lib/observability/correlation";

describe("correlation id", () => {
  it("generates RFC4122 UUID v4", () => {
    const id = generateCorrelationId();
    expect(isValidCorrelationId(id)).toBe(true);
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("honors inbound X-Correlation-ID (case-insensitive header)", () => {
    const headers = new Headers({
      [CORRELATION_ID_HEADER]: "11111111-2222-4333-a444-555555555555",
    });
    expect(resolveCorrelationId(headers)).toBe(
      "11111111-2222-4333-a444-555555555555",
    );
  });

  it("generates when inbound header missing or invalid", () => {
    expect(isValidCorrelationId(resolveCorrelationId(new Headers()))).toBe(
      true,
    );
    const bad = new Headers({ [CORRELATION_ID_HEADER]: "not-a-uuid" });
    expect(resolveCorrelationId(bad)).not.toBe("not-a-uuid");
    expect(isValidCorrelationId(resolveCorrelationId(bad))).toBe(true);
  });

  it("uses request id as correlation fallback when correlation absent", () => {
    const headers = new Headers({
      [REQUEST_ID_HEADER]: "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee",
    });
    expect(resolveCorrelationId(headers)).toBe(
      "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee",
    );
  });

  it("resolveRequestId prefers x-request-id then correlation", () => {
    const corr = "11111111-2222-4333-a444-555555555555";
    const req = "aaaaaaaa-bbbb-4ccc-addd-eeeeeeeeeeee";
    expect(
      resolveRequestId(
        new Headers({
          [CORRELATION_ID_HEADER]: corr,
          [REQUEST_ID_HEADER]: req,
        }),
        corr,
      ),
    ).toBe(req);
    expect(resolveRequestId(new Headers(), corr)).toBe(corr);
  });
});

describe("middleware correlation resolution", () => {
  it("attaches resolved correlation and request ids to header maps", () => {
    const inbound = "11111111-2222-4333-a444-555555555555";
    const requestHeaders = new Headers({
      [CORRELATION_ID_HEADER]: inbound,
    });
    const correlationId = resolveCorrelationId(requestHeaders);
    const requestId = resolveRequestId(requestHeaders, generateCorrelationId());

    const outbound = new Headers(requestHeaders);
    outbound.set(CORRELATION_ID_HEADER, correlationId);
    outbound.set(REQUEST_ID_HEADER, requestId);

    expect(outbound.get(CORRELATION_ID_HEADER)).toBe(inbound);
    expect(isValidCorrelationId(outbound.get(REQUEST_ID_HEADER)!)).toBe(true);
  });
});
