import { describe, expect, it } from "vitest";
import { isDayComplete, levelFor, reminderTone, reminderMessage } from "./progress";

describe("progress rules", () => {
  it("day complete only within 90-110% of goal", () => {
    expect(isDayComplete(2000, 2000)).toBe(true);
    expect(isDayComplete(1700, 2000)).toBe(false);
    expect(isDayComplete(2300, 2000)).toBe(false);
  });
  it("levels: 10 iniciante, 60 profissional, 365 disciplinado", () => {
    expect(levelFor(9).current).toBeNull();
    expect(levelFor(10).current?.key).toBe("iniciante");
    expect(levelFor(60).current?.key).toBe("profissional");
    expect(levelFor(365).current?.key).toBe("disciplinado");
  });
  it("absent users get harsh tone; frequent users never praised", () => {
    expect(reminderTone({ daysSinceLastLog: 3, completionRate: 0.9 })).toBe("harsh");
    expect(reminderTone({ daysSinceLastLog: 1, completionRate: 0.9 })).toBe("firm");
    expect(reminderTone({ daysSinceLastLog: 0, completionRate: 0.9 })).toBe("steady");
    expect(reminderMessage("steady", 0)).toBe("Continue com sua disciplina, sem rodeios.");
  });
});
