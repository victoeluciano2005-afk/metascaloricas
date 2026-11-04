import { format, subDays } from "date-fns";

/** Period categories based on the share of completed goal days in the last 7 / 30 / 365 days. */
export const CATEGORIES = [
  { key: "bronze", label: "Bronze", emoji: "🥉", min: 0 },
  { key: "prata", label: "Prata", emoji: "🥈", min: 0.4 },
  { key: "ouro", label: "Ouro", emoji: "🥇", min: 0.7 },
  { key: "diamante", label: "Diamante", emoji: "💎", min: 0.9 },
] as const;

export const PERIODS = [
  { key: "week", label: "Semana", days: 7 },
  { key: "month", label: "Mês", days: 30 },
  { key: "year", label: "Ano", days: 365 },
] as const;

export function categoryFor(rate: number) {
  let c: (typeof CATEGORIES)[number] = CATEGORIES[0];
  for (const x of CATEGORIES) if (rate >= x.min) c = x;
  return c;
}

export function periodCategories(complete: Set<string>, today = new Date()) {
  return PERIODS.map((p) => {
    let done = 0;
    for (let i = 0; i < p.days; i++) if (complete.has(format(subDays(today, i), "yyyy-MM-dd"))) done++;
    const rate = done / p.days;
    return { ...p, done, rate, category: categoryFor(rate) };
  });
}
