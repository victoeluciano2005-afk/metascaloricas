import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Food } from "./food-types";
import { searchGeneric } from "./generic-foods";

const num = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};

async function fetchOFF(q: string, lang: string): Promise<any[]> {
  const fields =
    "code,product_name,product_name_pt,generic_name,brands,image_front_small_url,image_front_url,nutriments,serving_quantity";
  const headers = { "User-Agent": "NutriTrack/1.0 (contato@nutritrack.app)" };
  const get = async (u: URL, key: "hits" | "products") => {
    const r = await fetch(u, { headers, signal: AbortSignal.timeout(9000) });
    if (!r.ok) throw new Error("OFF " + r.status);
    return ((await r.json()) as Record<string, any[]>)[key] ?? [];
  };
  const u1 = new URL("https://search.openfoodfacts.org/search");
  u1.search = new URLSearchParams({ q, page_size: "60", langs: `${lang},en`, fields }).toString();
  const u2 = new URL("https://br.openfoodfacts.org/cgi/search.pl");
  u2.search = new URLSearchParams({
    search_terms: q, search_simple: "1", action: "process", json: "1", page_size: "60", lc: lang, fields,
  }).toString();
  const rs = await Promise.allSettled([get(u2, "products"), get(u1, "hits")]);
  if (rs.every((r) => r.status === "rejected")) throw new Error("OFF unavailable");
  return rs.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

async function searchOFF(q: string, lang: string): Promise<Food[]> {
  return (await fetchOFF(q, lang))
    .map((p): Food | null => {
      const n = p.nutriments ?? {};
      const kcal = num(n["energy-kcal_100g"]) || num(n["energy_100g"]) / 4.184;
      const name = p.product_name_pt || p.product_name || p.generic_name;
      if (!name || !kcal) return null;
      return {
        id: "off-" + p.code,
        name: String(name),
        brand: Array.isArray(p.brands) ? (p.brands[0] ?? null) : p.brands ? (String(p.brands).split(",")[0] ?? null) : null,
        image: p.image_front_small_url || p.image_front_url || null,
        kcal: Math.round(kcal),
        protein: num(n.proteins_100g),
        carbs: num(n.carbohydrates_100g),
        fat: num(n.fat_100g),
        servingG: num(p.serving_quantity) || null,
        source: "Open Food Facts",
      };
    })
    .filter((x): x is Food => x !== null);
}

async function searchUSDA(q: string): Promise<Food[]> {
  const key = process.env["USDA_API_KEY"] || "DEMO_KEY";
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.search = new URLSearchParams({
    api_key: key,
    query: q,
    pageSize: "8",
    dataType: "Foundation,SR Legacy",
  }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error("USDA " + res.status);
  const data = (await res.json()) as { foods?: any[] };
  return (data.foods ?? []).map((f) => {
    const get = (id: number) =>
      num(f.foodNutrients?.find((x: any) => x.nutrientId === id)?.value);
    return {
      id: "usda-" + f.fdcId,
      name: String(f.description).toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()),
      brand: "Alimento genérico (USDA)",
      image: null,
      kcal: Math.round(get(1008) || get(2047) || get(2048)),
      protein: get(1003),
      carbs: get(1005),
      fat: get(1004),
      servingG: null,
      source: "USDA",
    } satisfies Food;
  }).filter((f) => f.kcal > 0);
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Keep only foods whose name really matches what the user typed; best matches first.
export function rankByQuery(foods: Food[], q: string): Food[] {
  const tokens = norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  const nq = tokens.join(" ");
  const seen = new Set<string>();
  return foods
    .map((f) => {
      const name = norm(f.name);
      const words = name.split(/[^a-z0-9]+/).filter(Boolean);
      if (!tokens.every((t) => words.some((w) => w.startsWith(t)))) return null;
      let score = 0;
      if (name === nq) score += 100;
      if (name.startsWith(nq)) score += 50;
      if (words[0] === tokens[0]) score += 30;
      if (tokens.every((t) => words.includes(t))) score += 20;
      if (f.image) score += 5;
      score -= words.length;
      return { f, score };
    })
    .filter((x): x is { f: Food; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f)
    .filter((f) => {
      const k = norm(f.name) + "|" + (f.brand ?? "");
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 30);
}

// Products: drop brand duplicates (same name = same food) and generic-looking names already covered.
function dedupeProducts(products: Food[], generic: Food[]): Food[] {
  const seen = new Set(generic.map((g) => norm(g.name)));
  const out: Food[] = [];
  for (const p of products) {
    const k = norm(p.name).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
    // A product called just "Arroz"/"Ovo" adds nothing when a generic item exists.
    if (generic.length && k.split(" ").length <= 1) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...p, image: null });
  }
  return out.slice(0, 12);
}

export const searchFoods = createServerFn({ method: "GET" })
  .inputValidator(z.object({ q: z.string().trim().min(2).max(80), lang: z.string().max(5).default("pt") }))
  .handler(async ({ data }) => {
    const generic = searchGeneric(data.q);
    let products: Food[] = [];
    try {
      products = rankByQuery(await searchOFF(data.q, data.lang), data.q);
    } catch (e) {
      console.error("food search failed", e);
      if (!generic.length) throw new Error("Não foi possível buscar alimentos agora. Tente novamente.");
    }
    return { generic, products: dedupeProducts(products, generic) };
  });
