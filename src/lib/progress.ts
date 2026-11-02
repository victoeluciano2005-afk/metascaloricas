// Pure rules for daily goal completion, levels and reminder tone.

/** A day is complete when calories land within 90%–110% of the goal. */
export function isDayComplete(kcal: number, goal: number) {
  if (!goal || kcal <= 0) return false;
  return kcal >= goal * 0.9 && kcal <= goal * 1.1;
}

export const LEVELS = [
  { key: "iniciante", label: "Iniciante", days: 10, emoji: "🌱" },
  { key: "profissional", label: "Profissional", days: 60, emoji: "🏅" },
  { key: "disciplinado", label: "Disciplinado", days: 365, emoji: "👑" },
] as const;

export function levelFor(completedDays: number) {
  let current: (typeof LEVELS)[number] | null = null;
  for (const l of LEVELS) if (completedDays >= l.days) current = l;
  const next = LEVELS.find((l) => completedDays < l.days) ?? null;
  return { current, next };
}

/** Current streak of complete days ending today (or yesterday if today isn't done yet). */
export function currentStreak(completeDates: Set<string>, today: Date) {
  const d = new Date(today);
  const key = (x: Date) => x.toISOString().slice(0, 10);
  if (!completeDates.has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (completeDates.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export type Tone = "harsh" | "firm" | "praise";

/**
 * Engagement-based tone. Low usage -> harsh. Consistent users still get charged;
 * praise only rarely (rand < 0.1) and only when the user is consistent.
 */
export function reminderTone(opts: { daysSinceLastLog: number; completionRate: number; rand: number }): Tone {
  const { daysSinceLastLog, completionRate, rand } = opts;
  if (daysSinceLastLog >= 2 || completionRate < 0.3) return "harsh";
  if (completionRate >= 0.7 && rand < 0.1) return "praise";
  return "firm";
}

const MSGS: Record<Tone, string[]> = {
  harsh: [
    "Se não quer seu resultado, desinstale que outros que não são você irão ter.",
    "Você sumiu. Seu objetivo não vai se cumprir sozinho. Registre agora.",
    "Desculpas não queimam calorias. Abra o diário e registre o que comeu.",
    "Quem desiste no meio nunca vê o resultado. Volte agora ou admita que desistiu.",
  ],
  firm: [
    "Ainda não registrou suas refeições de hoje. Não deixe pra depois.",
    "Meta batida ontem não conta hoje. Registre o que comeu.",
    "Consistência é tudo. Cadê o registro de hoje?",
    "Bom não é suficiente. Feche a meta de hoje.",
  ],
  praise: [
    "Você está mandando bem. Agora não relaxe: feche a meta de hoje também.",
    "Disciplina de verdade. Continue assim — amanhã tem mais.",
  ],
};

export function reminderMessage(tone: Tone, rand: number) {
  const list = MSGS[tone];
  return list[Math.floor(rand * list.length) % list.length]!;
}
