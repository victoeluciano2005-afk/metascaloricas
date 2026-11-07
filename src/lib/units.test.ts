import { describe, expect, it } from "vitest";
import { formatQty, isDrink, qtyUnit } from "./units";

describe("isDrink", () => {
  it("detects common drinks", () => {
    for (const n of ["Suco de laranja natural", "Refrigerante de cola", "Água", "Café sem açúcar", "Cerveja", "Leite integral", "Água de coco", "Vinho tinto", "Energético", "Vitamina de banana", "Chá sem açúcar"]) {
      expect(isDrink(n), n).toBe(true);
    }
  });
  it("does not flag solid foods", () => {
    for (const n of ["Arroz branco cozido", "Peito de frango grelhado", "Pão francês", "Banana prata", "Bolo de milho"]) {
      expect(isDrink(n), n).toBe(false);
    }
  });
});

describe("formatQty", () => {
  it("uses ml under 1 liter", () => {
    expect(formatQty(350, "Refrigerante de cola")).toBe("350 ml");
    expect(formatQty(200, "Suco de laranja natural")).toBe("200 ml");
  });
  it("uses L from 1 liter up", () => {
    expect(formatQty(1000, "Água")).toBe("1 L");
    expect(formatQty(1500, "Água")).toBe("1,5 L");
  });
  it("keeps g for solid foods", () => {
    expect(formatQty(150, "Arroz branco cozido")).toBe("150 g");
  });
});

describe("qtyUnit", () => {
  it("returns ml for drinks and g for foods", () => {
    expect(qtyUnit("Cerveja")).toBe("ml");
    expect(qtyUnit("Feijão carioca cozido")).toBe("g");
  });
});
