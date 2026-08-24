import { describe, expect, it } from "vitest";
import {
  msUntilNextScheduleBoundary,
  nextScheduleBoundary,
  resolveEffectiveTheme,
  resolveScheduledTheme,
} from "@/lib/theme/schedule";

function atHour(hour: number, minute = 0, day = 20): Date {
  return new Date(2026, 7, day, hour, minute, 0, 0);
}

describe("automatic theme schedule (local device time)", () => {
  it("is light from 6:00 AM through 5:59 PM", () => {
    expect(resolveScheduledTheme(atHour(6, 0))).toBe("light");
    expect(resolveScheduledTheme(atHour(7, 0))).toBe("light");
    expect(resolveScheduledTheme(atHour(12, 0))).toBe("light");
    expect(resolveScheduledTheme(atHour(17, 59))).toBe("light");
  });

  it("is dark from 6:00 PM through 5:59 AM", () => {
    expect(resolveScheduledTheme(atHour(18, 0))).toBe("dark");
    expect(resolveScheduledTheme(atHour(23, 30))).toBe("dark");
    expect(resolveScheduledTheme(atHour(0, 0))).toBe("dark");
    expect(resolveScheduledTheme(atHour(5, 59))).toBe("dark");
  });

  it("follows the schedule when there is no manual override", () => {
    expect(resolveEffectiveTheme(null, null, atHour(7, 0))).toBe("light");
    expect(resolveEffectiveTheme(null, null, atHour(17, 59))).toBe("light");
    expect(resolveEffectiveTheme(null, null, atHour(18, 0))).toBe("dark");
    expect(resolveEffectiveTheme(null, null, atHour(5, 59))).toBe("dark");
    expect(resolveEffectiveTheme("auto", null, atHour(10))).toBe("light");
    expect(resolveEffectiveTheme("system", null, atHour(22))).toBe("dark");
  });

  it("keeps a manual Light/Dark choice until the next 6 AM / 6 PM boundary", () => {
    const morning = atHour(7, 0);
    const untilDusk = nextScheduleBoundary(morning).getTime();

    expect(resolveEffectiveTheme("dark", untilDusk, morning)).toBe("dark");
    expect(resolveEffectiveTheme("dark", untilDusk, atHour(17, 59))).toBe("dark");
    expect(resolveEffectiveTheme("dark", untilDusk, atHour(18, 0))).toBe("dark");

    const evening = atHour(20, 0);
    const untilDawn = nextScheduleBoundary(evening).getTime();
    expect(resolveEffectiveTheme("light", untilDawn, evening)).toBe("light");
    expect(resolveEffectiveTheme("light", untilDawn, atHour(5, 59, 21))).toBe(
      "light",
    );
    expect(resolveEffectiveTheme("light", untilDawn, atHour(6, 0, 21))).toBe(
      "light",
    );
  });

  it("returns to the scheduled mode after the override timestamp", () => {
    const untilDusk = nextScheduleBoundary(atHour(10, 0)).getTime();
    expect(resolveEffectiveTheme("dark", untilDusk, atHour(18, 0))).toBe("dark");
    expect(resolveEffectiveTheme("dark", untilDusk, atHour(6, 0, 21))).toBe(
      "light",
    );

    const untilDawn = nextScheduleBoundary(atHour(20, 0)).getTime();
    expect(resolveEffectiveTheme("light", untilDawn, atHour(6, 0, 21))).toBe(
      "light",
    );
    expect(resolveEffectiveTheme("light", untilDawn, atHour(18, 0, 21))).toBe(
      "dark",
    );
  });

  it("keeps a legacy always-on choice only while it differs from the current window", () => {
    expect(resolveEffectiveTheme("dark", null, atHour(10, 0))).toBe("dark");
    expect(resolveEffectiveTheme("light", null, atHour(22, 0))).toBe("light");
    expect(resolveEffectiveTheme("light", null, atHour(10, 0))).toBe("light");
  });

  it("arms the next boundary at 6:00 PM during the light window", () => {
    const now = atHour(10, 0);
    expect(msUntilNextScheduleBoundary(now)).toBe(
      atHour(18, 0).getTime() - now.getTime(),
    );
    expect(nextScheduleBoundary(now).getHours()).toBe(18);
  });

  it("arms the next boundary at 6:00 AM during the dark window", () => {
    const evening = atHour(20, 0);
    const nextMorning = new Date(2026, 7, 21, 6, 0, 0, 0);
    expect(msUntilNextScheduleBoundary(evening)).toBe(
      nextMorning.getTime() - evening.getTime(),
    );

    const beforeDawn = atHour(4, 0);
    expect(msUntilNextScheduleBoundary(beforeDawn)).toBe(
      atHour(6, 0).getTime() - beforeDawn.getTime(),
    );
  });
});
