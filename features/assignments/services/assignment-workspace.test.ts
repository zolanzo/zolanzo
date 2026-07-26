import { describe, expect, it } from "vitest";
import {
  assertExecutionOrder,
  buildExecutionPlan,
} from "@/features/assignments/services/execution-engine";
import {
  canSkipStep,
  canTransitionStep,
  dependenciesSatisfied,
} from "@/features/assignments/services/checklist-engine";
import { calculateAssignmentProgress } from "@/features/assignments/services/progress-engine";
import {
  canTransitionAssignment,
  normalizeAssignmentStatus,
} from "@/features/assignments/services/lifecycle";
import type { TemplateStepDefinition } from "@/features/task-templates/types";

const capabilitySet: TemplateStepDefinition[] = [
  {
    key: "download",
    capability: "downloads_app",
    instruction: "Install the app",
    required: true,
  },
  {
    key: "open",
    capability: "opens_app",
    instruction: "Open the app",
    required: true,
  },
  {
    key: "feedback",
    capability: "submits_text",
    instruction: "Leave feedback",
    required: false,
  },
];

describe("execution engine", () => {
  it("builds ordered steps with linear dependencies", () => {
    const plan = buildExecutionPlan({
      capabilitySet,
      estimatedDurationMin: 30,
    });
    expect(plan).toHaveLength(3);
    expect(plan[0]?.sequence).toBe(1);
    expect(plan[1]?.dependsOnStepKeys).toEqual(["download"]);
    expect(plan[2]?.required).toBe(false);
    expect(assertExecutionOrder(plan).ok).toBe(true);
  });

  it("rejects duplicate keys", () => {
    expect(() =>
      buildExecutionPlan({
        capabilitySet: [
          capabilitySet[0]!,
          { ...capabilitySet[0]!, instruction: "dup" },
        ],
      }),
    ).toThrow(/Duplicate/);
  });
});

describe("checklist engine", () => {
  it("allows pending → in_progress → completed", () => {
    expect(canTransitionStep("pending", "in_progress")).toBe(true);
    expect(canTransitionStep("in_progress", "completed")).toBe(true);
    expect(canTransitionStep("completed", "pending")).toBe(false);
  });

  it("blocks skipping required steps", () => {
    expect(canSkipStep(true)).toBe(false);
    expect(canSkipStep(false)).toBe(true);
  });

  it("checks dependencies", () => {
    expect(
      dependenciesSatisfied({
        dependsOnStepKeys: ["download"],
        statusByKey: { download: "completed" },
      }),
    ).toBe(true);
    expect(
      dependenciesSatisfied({
        dependsOnStepKeys: ["download"],
        statusByKey: { download: "pending" },
      }),
    ).toBe(false);
  });
});

describe("progress engine", () => {
  it("computes percentage and ready state", () => {
    const progress = calculateAssignmentProgress({
      steps: [
        { required: true, status: "completed", estimatedDurationMin: 5 },
        { required: true, status: "pending", estimatedDurationMin: 10 },
        { required: false, status: "skipped", estimatedDurationMin: 2 },
      ],
      startedAt: "2026-07-25T00:00:00.000Z",
      lastActivityAt: "2026-07-25T00:10:00.000Z",
      completedAt: null,
    });
    expect(progress.completedSteps).toBe(2);
    expect(progress.progressPercent).toBe(67);
    expect(progress.readyForSubmission).toBe(false);
    expect(progress.estimatedRemainingMin).toBe(10);

    const ready = calculateAssignmentProgress({
      steps: [
        { required: true, status: "completed", estimatedDurationMin: 5 },
        { required: true, status: "completed", estimatedDurationMin: 10 },
      ],
      startedAt: null,
      lastActivityAt: null,
      completedAt: null,
    });
    expect(ready.readyForSubmission).toBe(true);
    expect(ready.progressPercent).toBe(100);
  });
});

describe("assignment lifecycle", () => {
  it("supports workspace transitions", () => {
    expect(canTransitionAssignment("assigned", "started")).toBe(true);
    expect(canTransitionAssignment("started", "in_progress")).toBe(true);
    expect(canTransitionAssignment("in_progress", "paused")).toBe(true);
    expect(canTransitionAssignment("paused", "in_progress")).toBe(true);
    expect(
      canTransitionAssignment("in_progress", "ready_for_submission"),
    ).toBe(true);
    expect(normalizeAssignmentStatus("claimed")).toBe("assigned");
  });
});
