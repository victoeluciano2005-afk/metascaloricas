// Detects drinks and formats quantities: beverages show in mL/L, foods in g.

const DRINK_WORDS = [
  "suco", "agua", "cafe", "cha", "refrigerante", "guarana", "cerveja", "vinho",
  "leite", "bebida", "energetico", "isotonico", "caldo de cana", "caipirinha",
  "chimarrao", "vitamina", "shake", "achocolatado", "refresco", "coco",
];

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** True when the name is a drink/liquid (measured in mL, not g). */
export function isDrink(name: string): boolean {
  const n = norm(name);
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  return DRINK_WORDS.some((d) => {
    const dw = d.split(" ");
    return dw.every((w) => words.includes(w));
  });
}

/** Format a quantity (stored as g/ml) for display: drinks → "350 ml" or "1,2 L", foods → "150 g". */
export function formatQty(quantity: number, name: string): string {
  const q = Math.round(quantity);
  if (!isDrink(name)) return `${q} g`;
  if (q >= 1000) {
    const l = q / 1000;
    return `${l.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} L`;
  }
  return `${q} ml`;
}

/** Unit label for quantity inputs: "ml" for drinks, "g" for foods. */
export function qtyUnit(name: string): "ml" | "g" {
  return isDrink(name) ? "ml" : "g";
}
