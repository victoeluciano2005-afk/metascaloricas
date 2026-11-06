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
  const key = (x: Date) => `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
  if (!completeDates.has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (completeDates.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export type Tone = "harsh" | "firm" | "steady";

/**
 * Engagement-based tone, never praise.
 * Away 2+ days or low completion -> harsh. Away 1 day -> firm.
 * Frequent users -> steady ("continue, sem rodeios"), no comfort zone.
 */
export function reminderTone(opts: { daysSinceLastLog: number; completionRate: number; rand?: number }): Tone {
  const { daysSinceLastLog, completionRate } = opts;
  if (daysSinceLastLog >= 2 || completionRate < 0.3) return "harsh";
  if (daysSinceLastLog >= 1 || completionRate < 0.6) return "firm";
  return "steady";
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
    "Um dia fora já é um passo atrás. Abra o diário agora.",
    "Consistência é tudo. Cadê o registro de hoje?",
  ],
  steady: [
    "Continue com sua disciplina, sem rodeios.",
    "Nada de relaxar. Registre hoje como fez ontem.",
    "Constância não é opcional. Feche a meta de hoje.",
    "Você sabe o caminho. Faça o seu trabalho e registre.",
  ],
};

export function reminderMessage(tone: Tone, rand: number) {
  const list = MSGS[tone];
  return list[Math.floor(Math.max(0, Math.min(rand, .999999)) * list.length)] ?? list[0] ?? '';
}
