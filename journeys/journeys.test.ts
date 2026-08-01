/**
 * Phase 3B.4 — Business journey certification suite.
 */

import { describe, expect, it } from "vitest";
import { runBusinessJourneyCertification } from "@/journeys/certify";
import {
  DOMAIN_NOTIFICATION_WIRING,
  JOURNEY_SURFACES,
  allSurfacesPresent,
  notificationWiringComplete,
  productListingMarketplaceExists,
} from "@/journeys/evidence";

describe("Phase 3B.4 journey surfaces", () => {
  it("exposes auth / org / campaign / payment / admin surfaces", () => {
    for (const [name, paths] of Object.entries(JOURNEY_SURFACES)) {
      const result = allSurfacesPresent(paths);
      expect(result.ok, `${name} missing ${result.missing.join(", ")}`).toBe(
        true,
      );
    }
  });

  it("wires domain → notification emits for critical events", () => {
    const wiring = notificationWiringComplete();
    expect(wiring.ok, wiring.missing.join("; ")).toBe(true);
    expect(DOMAIN_NOTIFICATION_WIRING.length).toBeGreaterThanOrEqual(8);
  });

  it("does not claim product listing marketplace exists", () => {
    expect(productListingMarketplaceExists()).toBe(false);
  });
});

describe("Phase 3B.4 business journey certification", () => {
  it("produces PASS/FAIL/BLOCKED for all eight journeys", () => {
    const report = runBusinessJourneyCertification({
      databaseReachable: false,
    });

    expect(report.journeys).toHaveLength(8);
    expect(report.mode).toBe("path_contract");
    expect(report.criticalPass).toBe(true);
    expect(["conditional_pilot", "pilot_launch"]).toContain(
      report.recommendation,
    );

    const byId = Object.fromEntries(
      report.journeys.map((j) => [j.id, j] as const),
    ) as Record<string, (typeof report.journeys)[number]>;
    expect(byId.J1!.status).toBe("PASS");
    expect(byId.J2!.status).toBe("PASS");
    expect(byId.J3!.status).toBe("BLOCKED");
    expect(byId.J4!.status).toBe("PASS");
    expect(["PASS", "BLOCKED"]).toContain(byId.J5!.status);
    expect(["PASS", "BLOCKED"]).toContain(byId.J6!.status);
    expect(byId.J7!.status).toBe("PASS");
    expect(byId.J8!.status).toBe("PASS");
  });

  it("scores business workflow readiness", () => {
    const report = runBusinessJourneyCertification();
    expect(report.businessWorkflowReadiness).toBeGreaterThanOrEqual(40);
    expect(report.recommendationRationale.length).toBeGreaterThan(20);
  });
});
