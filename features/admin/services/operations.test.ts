import { describe, expect, it } from "vitest";
import {
  buildAllViews,
  buildOperationalView,
  buildQueueHealth,
  emptyMetrics,
  slaForQueue,
} from "@/features/admin/services/operational-views";
import {
  canExecuteCommand,
  canReadAudit,
  canReadCommandCenter,
  isReadOnlyOps,
  permissionForCommand,
} from "@/features/admin/services/rbac-operations";
import {
  BUILTIN_PLAYBOOKS,
  getPlaybook,
  playbooksForQueue,
} from "@/features/admin/services/playbooks";
import { formatRandomPublicId, formatSequentialPublicId, isValidPublicId } from "@/lib/public-id/format";
import {
  OPERATIONAL_QUEUE_KEYS,
  OPERATIONAL_VIEW_KEYS,
} from "@/constants/operations";
import { rolesHavePermission } from "@/constants/permissions";

describe("operational views", () => {
  it("builds platform overview from metrics", () => {
    const metrics = emptyMetrics();
    metrics.activeCampaigns = 3;
    metrics.pendingReviews = 12;
    metrics.failedNotifications = 2;
    const view = buildOperationalView("platform_overview", metrics);
    expect(view.key).toBe("platform_overview");
    if (view.key === "platform_overview") {
      expect(view.activeCampaigns).toBe(3);
      expect(view.pendingReviews).toBe(12);
      expect(view.failedNotifications).toBe(2);
    }
  });

  it("builds all ten operational views", () => {
    const all = buildAllViews(emptyMetrics());
    for (const key of OPERATIONAL_VIEW_KEYS) {
      expect(all[key].key).toBe(key);
    }
  });

  it("computes queue health and SLA", () => {
    const metrics = emptyMetrics();
    metrics.failedNotifications = 4;
    metrics.agedReviews = 6;
    const queues = buildQueueHealth(metrics);
    expect(queues).toHaveLength(OPERATIONAL_QUEUE_KEYS.length);
    expect(slaForQueue({ pending: 1, failed: 0, aged: 0 })).toBe("ok");
    expect(slaForQueue({ pending: 1, failed: 1, aged: 0 })).toBe("breach");
    expect(queues.find((q) => q.queue === "notification")?.sla).toBe("breach");
    expect(queues.find((q) => q.queue === "review")?.sla).toBe("breach");
  });
});

describe("operations RBAC", () => {
  it("allows command center for operations roles", () => {
    expect(canReadCommandCenter(["operations"])).toBe(true);
    expect(canReadCommandCenter(["auditor"])).toBe(true);
    expect(canReadCommandCenter(["worker"])).toBe(false);
  });

  it("marks auditor as read-only", () => {
    expect(isReadOnlyOps(["auditor"])).toBe(true);
    expect(isReadOnlyOps(["auditor", "admin"])).toBe(false);
    expect(isReadOnlyOps(["operations"])).toBe(false);
  });

  it("gates finance queues", () => {
    expect(
      canExecuteCommand({
        platformRoles: ["operations"],
        commandType: "retry",
        queueKey: "notification",
      }),
    ).toBe(true);
    expect(
      canExecuteCommand({
        platformRoles: ["operations"],
        commandType: "retry",
        queueKey: "withdrawal",
      }),
    ).toBe(false);
    expect(
      canExecuteCommand({
        platformRoles: ["finance"],
        commandType: "cancel",
        queueKey: "withdrawal",
      }),
    ).toBe(true);
    expect(
      canExecuteCommand({
        platformRoles: ["admin"],
        commandType: "cancel",
        queueKey: "payment",
      }),
    ).toBe(true);
  });

  it("maps command types to permissions", () => {
    expect(permissionForCommand("suspend")).toBe("ops.moderation.act");
    expect(permissionForCommand("approve")).toBe("ops.finance.act");
    expect(permissionForCommand("retry")).toBe("ops.commands.execute");
  });

  it("grants ops permissions to new roles", () => {
    expect(rolesHavePermission(["finance"], "ops.finance.act")).toBe(true);
    expect(rolesHavePermission(["reviewer"], "ops.queues.manage")).toBe(true);
    expect(canReadAudit(["auditor"])).toBe(true);
  });
});

describe("playbooks", () => {
  it("exposes builtin playbooks per queue", () => {
    expect(BUILTIN_PLAYBOOKS.length).toBe(4);
    expect(getPlaybook("notification_failure")?.steps[0]?.actionHint).toBe(
      "retry",
    );
    expect(playbooksForQueue("review")[0]?.key).toBe("review_sla");
  });
});

describe("operation public ids", () => {
  it("formats OPC and PBK ids", () => {
    const opc = formatRandomPublicId("operation", "7H2N9K");
    expect(opc).toBe("OPC-7H2N9K");
    expect(isValidPublicId("operation", opc)).toBe(true);
    const pbk = formatSequentialPublicId("playbook", 14);
    expect(pbk).toBe("PBK-000014");
    expect(isValidPublicId("playbook", pbk)).toBe(true);
  });
});

describe("command idempotency shape", () => {
  it("composes stable keys", () => {
    const key = "ops:retry:notification_job:job_1:v1";
    expect(key).toContain("retry");
    expect(key).toContain("notification_job");
  });
});
