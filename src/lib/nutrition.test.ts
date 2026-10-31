import { describe, expect, it } from "vitest";
import { bmr, calcGoals } from "./nutrition";

const man = { sex: "male" as const, age: 30, heightCm: 180, weightKg: 80, activity: "moderate" as const };

describe("nutrition", () => {
  it("Mifflin-St Jeor BMR for a man", () => {
    expect(bmr(man)).toBe(1780);
  });
  it("Mifflin-St Jeor BMR for a woman", () => {
    expect(bmr({ ...man, sex: "female" })).toBe(1614);
  });
  it("maintain = BMR x activity factor", () => {
    expect(calcGoals(man, "maintain").calories).toBe(2759);
  });
  it("lose = 500 kcal deficit", () => {
    expect(calcGoals(man, "lose").calories).toBe(2259);
  });
  it("gain = 400 kcal surplus", () => {
    expect(calcGoals(man, "gain").calories).toBe(3159);
  });
});
