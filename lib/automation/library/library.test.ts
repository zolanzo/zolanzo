/**
 * Phase 4.4B — Automation Library tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AutomationLibraryService,
  AutomationService,
  CategoryRegistry,
  RuleGenerator,
  STARTER_TEMPLATES,
  TemplateRegistry,
  TemplateValidator,
  AUTOMATION_LIBRARY_MODEL_VERSION,
  isAutomationLibraryEnabled,
  isAutomationTemplatesEnabled,
  resetAutomationStoreForTests,
  resetAutomationTelemetryForTests,
  resetLibraryInstallStoreForTests,
  resetLibraryTelemetryForTests,
} from "@/lib/automation";
import type { AutomationTemplate } from "@/lib/automation/library/types";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAutomationStoreForTests();
  resetAutomationTelemetryForTests();
  resetLibraryInstallStoreForTests();
  resetLibraryTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AUTOMATION_ENGINE;
  delete process.env.AUTOMATION_RULES;
  delete process.env.AUTOMATION_ACTIONS;
  delete process.env.AUTOMATION_LIBRARY;
  delete process.env.AUTOMATION_TEMPLATES;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Automation Library — registry", () => {
  it("registers six categories", () => {
    const cats = CategoryRegistry.list();
    expect(cats.map((c) => c.id).sort()).toEqual([
      "analytics",
      "campaigns",
      "operations",
      "organizations",
      "trust",
      "workers",
    ].sort());
  });

  it("ships ~20–30 starter templates across categories", () => {
    const templates = TemplateRegistry.list();
    expect(templates.length).toBeGreaterThanOrEqual(20);
    expect(templates.length).toBeLessThanOrEqual(30);
    expect(templates.length).toBe(STARTER_TEMPLATES.length);
    const categories = new Set(templates.map((t) => t.category));
    expect(categories.size).toBe(6);
  });

  it("exposes template versions", () => {
    const versions = TemplateRegistry.versions();
    expect(versions.every((v) => /^\d+\.\d+\.\d+$/.test(v.version))).toBe(true);
  });
});

describe("Automation Library — template validation", () => {
  it("validates all starter templates", () => {
    for (const t of TemplateRegistry.list()) {
      const result = TemplateValidator.validate(t);
      expect(result.ok, `${t.id}: ${result.errors.join("; ")}`).toBe(true);
      expect(t.permissions.length).toBeGreaterThan(0);
    }
  });

  it("rejects unknown triggers and missing permissions", () => {
    const bad: AutomationTemplate = {
      ...TemplateRegistry.get("worker.welcome")!,
      id: "bad.template",
      trigger: "not.a.trigger" as AutomationTemplate["trigger"],
      permissions: [],
      version: "not-semver",
    };
    const result = TemplateValidator.validate(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("trigger"))).toBe(true);
    expect(result.errors.some((e) => e.includes("permissions"))).toBe(true);
    expect(result.errors.some((e) => e.includes("semver"))).toBe(true);
  });

  it("flags version compatibility warnings for major > 1", () => {
    const t = {
      ...TemplateRegistry.get("worker.welcome")!,
      version: "2.0.0",
    };
    const result = TemplateValidator.validate(t, {
      compatibleWithEngineVersion: "1.0.0",
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes("major"))).toBe(true);
  });
});

describe("Automation Library — rule generation", () => {
  it("substitutes parameters into conditions", () => {
    const template = TemplateRegistry.get("ops.review_queue_escalation")!;
    const input = RuleGenerator.generate({
      template,
      parameters: { maxRevisions: 5 },
    });
    expect(input.trigger).toBe("submission.rejected");
    expect(input.actions[0]?.type).toBe("escalate_operations");
    const atom = input.conditions?.conditions[0] as { value?: unknown };
    expect(atom.value).toBe(5);
    expect(input.name).toContain("[Library]");
  });

  it("installs via AutomationService.createRule only", () => {
    const before = AutomationService.listRules().length;
    const result = AutomationLibraryService.install({
      templateId: "worker.welcome",
      organizationId: "org_test",
    });
    expect(result.ok).toBe(true);
    expect(result.install?.ruleId).toBeTruthy();
    expect(AutomationService.listRules().length).toBe(before + 1);
    const rule = AutomationService.getRule(result.install!.ruleId);
    expect(rule?.trigger).toBe("worker.registered");
    expect(rule?.actions[0]?.type).toBe("send_notification");
  });

  it("uninstall disables the generated rule", () => {
    const result = AutomationLibraryService.install({
      templateId: "trust.decline_warning",
    });
    expect(result.ok).toBe(true);
    const ok = AutomationLibraryService.uninstall(result.install!.id);
    expect(ok).toBe(true);
    const rule = AutomationService.getRule(result.install!.ruleId);
    expect(rule?.enabled).toBe(false);
  });
});

describe("Automation Library — feature flags", () => {
  it("defaults library/templates on when engine on", () => {
    expect(isAutomationLibraryEnabled()).toBe(true);
    expect(isAutomationTemplatesEnabled()).toBe(true);
  });

  it("respects AUTOMATION_LIBRARY=0", () => {
    process.env.AUTOMATION_LIBRARY = "0";
    expect(isAutomationLibraryEnabled()).toBe(false);
    expect(isAutomationTemplatesEnabled()).toBe(false);
    expect(AutomationLibraryService.listTemplates()).toEqual([]);
    const result = AutomationLibraryService.install({
      templateId: "worker.welcome",
    });
    expect(result.ok).toBe(false);
  });

  it("respects AUTOMATION_TEMPLATES=0", () => {
    process.env.AUTOMATION_TEMPLATES = "0";
    expect(isAutomationLibraryEnabled()).toBe(true);
    expect(isAutomationTemplatesEnabled()).toBe(false);
    const result = AutomationLibraryService.install({
      templateId: "worker.welcome",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("AUTOMATION_TEMPLATES");
  });

  it("exposes library model version", () => {
    expect(AUTOMATION_LIBRARY_MODEL_VERSION).toContain("automation-library");
  });
});

describe("Automation Library — health", () => {
  it("reports catalog + install usage", () => {
    AutomationLibraryService.install({ templateId: "worker.welcome" });
    AutomationLibraryService.install({ templateId: "ops.payment_failure_alert" });
    const health = AutomationLibraryService.health();
    expect(health.catalogSize).toBeGreaterThanOrEqual(20);
    expect(health.installedTemplates).toBe(2);
    expect(health.activeTemplates).toBeGreaterThanOrEqual(1);
    expect(health.mostUsed.length).toBeGreaterThan(0);
    expect(health.templateVersions.length).toBe(health.catalogSize);
  });
});
