import { describe, expect, it } from "vitest";
import { reviewDay } from "./day-review";

const goal = { calories: 2000, protein_g: 120, carbs_g: 230, fat_g: 60, objective: "maintain" as const };
const log = (food_name: string, meal: string, calories: number, protein_g: number, carbs_g: number, fat_g: number) => ({ food_name, meal, calories, protein_g, carbs_g, fat_g });

describe("reviewDay", () => {
  it("returns null when nothing was logged", () => {
    expect(reviewDay([], goal)).toBeNull();
  });
  it("charges the user when the goal is not completed", () => {
    const r = reviewDay([log("Arroz", "lunch", 1000, 20, 200, 5)], goal);
    expect(r?.complete).toBe(false);
    expect(r?.charge).toContain("Faltaram 1000 kcal");
    expect(r?.verdict).not.toBe("adequada");
  });
  it("rates a balanced complete day as adequada", () => {
    const r = reviewDay([
      log("Pão com ovo", "breakfast", 400, 20, 40, 15),
      log("Arroz, feijão, frango e salada de alface", "lunch", 800, 55, 100, 20),
      log("Banana", "snack", 200, 5, 45, 1),
      log("Frango com brócolis", "dinner", 600, 45, 45, 20),
    ], goal);
    expect(r?.verdict).toBe("adequada");
  });
  it("flags ultra-processed heavy day as inadequada", () => {
    const r = reviewDay([log("Pizza", "lunch", 1200, 40, 120, 55), log("Refrigerante", "snack", 700, 0, 175, 0)], goal);
    expect(r?.verdict).toBe("inadequada");
  });
});
