export interface Food {
  id: string;
  name: string;
  brand: string | null;
  image: string | null;
  /** values per 100 g */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  servingG: number | null;
  source: string;
}

export const MEALS = [
  { key: "breakfast", label: "Café da manhã", emoji: "☕" },
  { key: "lunch", label: "Almoço", emoji: "🍛" },
  { key: "dinner", label: "Jantar", emoji: "🍲" },
  { key: "snack", label: "Lanche", emoji: "🍎" },
] as const;
export type MealKey = (typeof MEALS)[number]["key"];

export const PLACEHOLDER_IMG = "/food-placeholder.svg";
