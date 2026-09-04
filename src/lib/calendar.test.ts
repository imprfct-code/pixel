import { describe, expect, it } from "vite-plus/test";
import { validatePracticeDate } from "../../shared/dates";
import { calendarDateKey, calendarDateLabel, entryDate } from "./calendar";

describe("practice dates", () => {
  it("keeps an explicit work date independent of upload time and time zone", () => {
    expect(entryDate({ practiceDate: "2024-02-29", createdAt: "2026-01-02T23:30:00Z" })).toBe(
      "2024-02-29",
    );
    expect(calendarDateKey("2024-02-29")).toBe("2024-02-29");
    expect(calendarDateLabel("2024-02-29")).toBe("feb 29, 2024");
  });

  it("uses the same local day for legacy entries and the calendar", () => {
    const localMidnight = new Date(2026, 0, 2, 0, 30);
    expect(entryDate({ createdAt: localMidnight.toISOString() })).toBe("2026-01-02");
    expect(calendarDateKey(localMidnight)).toBe("2026-01-02");
  });

  it("rejects impossible dates and future practice", () => {
    expect(validatePracticeDate("2024-02-29")).toBe("2024-02-29");
    for (const date of ["2025-02-29", "2026-04-31", "2026-13-01", "", "yesterday", "9999-01-01"]) {
      expect(() => validatePracticeDate(date)).toThrow();
    }
  });
});
