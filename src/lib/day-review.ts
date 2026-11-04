import { isDayComplete } from "./progress";
import type { Objective } from "./nutrition";

export interface ReviewLog { food_name: string; meal: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }
export interface ReviewGoal { calories: number; protein_g: number; carbs_g: number; fat_g: number; objective: Objective }

export type Verdict = "adequada" | "ajustar" | "inadequada";

const ULTRA = /(refrigerante|salgadinho|biscoito recheado|bolacha recheada|chocolate|sorvete|salsicha|nugget|linguiça|bacon|pizza|hamb|batata frita|coxinha|pastel|doce|bala|miojo|lasanha congelada)/i;
const VEG = /(alface|tomate|brócolis|brocolis|cenoura|couve|abobrinha|pepino|salada|espinafre|repolho|beterraba|chuchu|legume|vagem|abóbora|abobora)/i;
const FRUIT = /(banana|maçã|maca|laranja|mamão|mamao|melancia|abacaxi|manga|uva|morango|pera|goiaba|fruta|açaí|acai|kiwi|melão|melao)/i;

/** Analyses the day's meals. Returns null only when nothing was logged. */
export function reviewDay(logs: ReviewLog[], goal: ReviewGoal) {
  const t = logs.reduce((a, l) => ({ kcal: a.kcal + +l.calories, p: a.p + +l.protein_g, c: a.c + +l.carbs_g, f: a.f + +l.fat_g }), { kcal: 0, p: 0, c: 0, f: 0 });
  if (!logs.length) return null;
  const complete = isDayComplete(t.kcal, goal.calories);
  const good: string[] = [];
  const tips: string[] = [];
  let issues = 0;
  let charge: string | null = null;
  if (!complete) {
    issues += 2;
    const diff = Math.round(Math.abs(goal.calories - t.kcal));
    charge = t.kcal < goal.calories
      ? `Faltaram ${diff} kcal para sua meta. Meta pela metade é resultado pela metade. Termine o que começou.`
      : `Você passou ${diff} kcal da sua meta. Sem controle não existe resultado. Amanhã, mais disciplina.`;
  } else good.push("Meta de calorias batida.");
  const pct = (v: number, g: number) => (g ? v / g : 1);

  const pr = pct(t.p, goal.protein_g);
  if (pr < 0.8) { issues++; tips.push(`Proteína baixa (${Math.round(t.p)}/${goal.protein_g} g). Opções baratas: ovos, frango desfiado, feijão com arroz, sardinha em lata ou leite.`); }
  else good.push("Boa quantidade de proteína.");

  if (pct(t.f, goal.fat_g) > 1.25) { issues++; tips.push("Gordura acima da meta. Troque frituras por preparações cozidas, assadas ou grelhadas."); }
  if (pct(t.c, goal.carbs_g) > 1.25) { issues++; tips.push("Muito carboidrato. Reduza pães e massas e inclua mais legumes e feijão."); }
  else if (pct(t.c, goal.carbs_g) < 0.6 && goal.objective !== "lose") { issues++; tips.push("Pouco carboidrato para seu objetivo. Arroz, batata-doce, aveia e banana são boas fontes acessíveis."); }

  const ultra = logs.filter((l) => ULTRA.test(l.food_name));
  const ultraKcal = ultra.reduce((a, l) => a + +l.calories, 0);
  if (ultraKcal > t.kcal * 0.2) { issues += 2; tips.push(`${Math.round((ultraKcal / t.kcal) * 100)}% das calorias vieram de ultraprocessados (${ultra.slice(0, 2).map((u) => u.food_name).join(", ")}). Troque por frutas, iogurte natural ou pipoca caseira.`); }
  else if (ultra.length) tips.push("Teve ultraprocessados, mas em pouca quantidade. Tente zerar amanhã.");

  if (!logs.some((l) => VEG.test(l.food_name))) { issues++; tips.push("Sem verduras ou legumes hoje. Uma salada de alface, tomate e cenoura custa pouco e dá saciedade."); }
  else good.push("Incluiu verduras/legumes.");
  if (!logs.some((l) => FRUIT.test(l.food_name))) tips.push("Nenhuma fruta. Banana e laranja são baratas e práticas para o lanche.");
  else good.push("Comeu frutas.");

  const meals = new Set(logs.map((l) => l.meal));
  if (!meals.has("breakfast")) tips.push("Pulou o café da manhã. Pão com ovo ou cuscuz com ovo são opções acessíveis e saciantes.");
  if (goal.objective === "gain" && pr >= 0.8) tips.push("Para ganhar massa, distribua a proteína em todas as refeições.");
  if (goal.objective === "lose") tips.push("Para perder peso, priorize volume: mais legumes no prato e água ao longo do dia.");

  const verdict: Verdict = issues === 0 ? "adequada" : issues <= 2 ? "ajustar" : "inadequada";
  return { verdict, good, tips: tips.slice(0, 5), totals: t, complete, charge };
}
