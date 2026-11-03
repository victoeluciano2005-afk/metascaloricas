import { GENERIC_FOODS } from './generic-foods';
import type { MealKey } from './food-types';

export interface FoodHistory {
  food_name: string; meal: string; log_date: string; quantity_g: number;
  calories: number; protein_g: number; carbs_g: number; fat_g: number;
}
export interface PlateItem { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }
export interface Plate { meal: MealKey; items: PlateItem[]; calories: number; protein: number; carbs: number; fat: number; familiar: boolean }
const defaults: Record<MealKey, string[]> = {
  breakfast: ['Pão integral', 'Ovo de galinha cozido', 'Banana prata'],
  lunch: ['Arroz branco cozido', 'Feijão carioca cozido', 'Peito de frango grelhado', 'Brócolis cozido'],
  dinner: ['Batata doce cozida', 'Tilápia grelhada', 'Salada verde'],
  snack: ['Iogurte natural', 'Aveia em flocos', 'Maçã'],
};
const fraction: Record<MealKey, number> = { breakfast: .25, lunch: .35, dinner: .3, snack: .1 };

/** Recent, repeated choices for this meal outrank defaults; use recorded nutrition, not invented values. */
export function buildPlate(history: FoodHistory[], meal: MealKey, goal: number, remaining: number, today: string, variation = 0): Plate | null {
  if (remaining <= 0 || goal <= 0) return null;
  const grouped = new Map<string, { row: FoodHistory; count: number }>();
  for (const row of history.filter(r => r.meal === meal && r.log_date <= today).sort((a,b) => a.log_date.localeCompare(b.log_date))) {
    if (row.quantity_g <= 0 || row.calories <= 0) continue;
    const old = grouped.get(row.food_name);
    grouped.set(row.food_name, { row, count: (old?.count ?? 0) + 1 });
  }
  const ranked = [...grouped.values()].sort((a,b) => b.count - a.count || b.row.log_date.localeCompare(a.row.log_date));
  const picked = ranked.length ? ranked.slice(variation % ranked.length).concat(ranked.slice(0, variation % ranked.length)).slice(0,4).map(({row}) => ({
    name: row.food_name, grams: row.quantity_g, calories: row.calories, protein: row.protein_g, carbs: row.carbs_g, fat: row.fat_g,
  })) : defaults[meal].flatMap(name => {
    const food = GENERIC_FOODS.find(f => f.name === name);
    if (!food) return [];
    const grams = food.servingG ?? 100;
    return [{ name, grams, calories: food.kcal * grams / 100, protein: food.protein * grams / 100, carbs: food.carbs * grams / 100, fat: food.fat * grams / 100 }];
  });
  const target = Math.min(remaining, goal * fraction[meal]);
  const total = picked.reduce((s,i) => s+i.calories,0);
  if (!total) return null;
  const scale = Math.min(2, target / total);
  const items = picked.map(i => {
    const grams = Math.max(0, Math.floor(i.grams * scale));
    const factor = grams / i.grams;
    return { name: i.name, grams, calories: i.calories * factor, protein: i.protein * factor, carbs: i.carbs * factor, fat: i.fat * factor };
  }).filter(i => i.grams > 0);
  if (!items.length) return null;
  return { meal, items, familiar: ranked.length > 0, calories: items.reduce((s,i) => s+i.calories,0), protein: items.reduce((s,i) => s+i.protein,0), carbs: items.reduce((s,i) => s+i.carbs,0), fat: items.reduce((s,i) => s+i.fat,0) };
}