import { describe, expect, it } from "vitest";
import { APP_CONFIG } from "@/config/app";

describe("official support contacts", () => {
  it("exposes the Admin WhatsApp number and wa.me link", () => {
    expect(APP_CONFIG.supportWhatsApp.display).toBe("+234 704 555 9401");
    expect(APP_CONFIG.supportWhatsApp.href).toBe("https://wa.me/2347045559401");
  });
});
