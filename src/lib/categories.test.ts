import { describe, expect, it } from "vitest";
import { categoryFor, periodCategories } from "./categories";

describe("categories", () => {
  it("maps rates to categories", () => {
    expect(categoryFor(0.2).key).toBe("bronze");
    expect(categoryFor(0.5).key).toBe("prata");
    expect(categoryFor(0.75).key).toBe("ouro");
    expect(categoryFor(0.95).key).toBe("diamante");
  });
  it("counts completed days in the last week", () => {
    const today = new Date("2026-11-03T12:00:00");
    const set = new Set(["2026-11-03", "2026-11-02", "2026-11-01", "2026-10-31", "2026-10-30", "2026-10-29", "2026-10-28"]);
    const [week, month] = periodCategories(set, today);
    expect(week!.done).toBe(7);
    expect(week!.category.key).toBe("diamante");
    expect(month!.category.key).toBe("bronze");
  });
});
