export type Sex = "male" | "female";
export type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Objective = "lose" | "maintain" | "gain";

export const ACTIVITY: Record<Activity, { label: string; desc: string; factor: number }> = {
  sedentary: { label: "Sedentário", desc: "Pouco ou nenhum exercício", factor: 1.2 },
  light: { label: "Leve", desc: "Exercício 1–3x por semana", factor: 1.375 },
  moderate: { label: "Moderado", desc: "Exercício 3–5x por semana", factor: 1.55 },
  active: { label: "Ativo", desc: "Exercício 6–7x por semana", factor: 1.725 },
  very_active: { label: "Muito ativo", desc: "Treino intenso ou trabalho físico", factor: 1.9 },
};

export const OBJECTIVES: Record<Objective, { label: string; desc: string; emoji: string }> = {
  lose: { label: "Perder peso", desc: "Déficit de ~500 kcal/dia", emoji: "🥗" },
  maintain: { label: "Manter peso", desc: "Equilíbrio calórico", emoji: "⚖️" },
  gain: { label: "Aumentar peso", desc: "Superávit de ~400 kcal/dia", emoji: "💪" },
};

export interface BodyData {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Activity;
}

/** Mifflin-St Jeor */
export function bmr({ sex, age, heightCm, weightKg }: BodyData) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

export function tdee(d: BodyData) {
  return bmr(d) * ACTIVITY[d.activity].factor;
}

export const OBJECTIVE_ADJUST: Record<Objective, number> = { lose: -500, maintain: 0, gain: 400 };

export function calcGoals(d: BodyData, objective: Objective) {
  const minimum = d.sex === "male" ? 1500 : 1200;
  const calories = Math.max(minimum, Math.round(tdee(d) + OBJECTIVE_ADJUST[objective]));
  const proteinPerKg = objective === "lose" ? 2.0 : objective === "gain" ? 1.8 : 1.6;
  const protein = Math.round(d.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}
