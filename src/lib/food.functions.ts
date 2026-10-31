import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Food } from "./food-types";

const num = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : 0;
};

async function searchOFF(q: string, lang: string): Promise<Food[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.search = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "20",
    lc: lang,
    fields:
      "code,product_name,product_name_pt,generic_name,brands,image_front_small_url,image_front_url,nutriments,serving_quantity",
  }).toString();
  const res = await fetch(url, {
    headers: { "User-Agent": "NutriTrack/1.0 (contato@nutritrack.app)" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error("OFF " + res.status);
  const data = (await res.json()) as { products?: any[] };
  return (data.products ?? [])
    .map((p): Food | null => {
      const n = p.nutriments ?? {};
      const kcal = num(n["energy-kcal_100g"]) || num(n["energy_100g"]) / 4.184;
      const name = p.product_name_pt || p.product_name || p.generic_name;
      if (!name || !kcal) return null;
      return {
        id: "off-" + p.code,
        name: String(name),
        brand: p.brands ? String(p.brands).split(",")[0] : null,
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
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
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

export const searchFoods = createServerFn({ method: "GET" })
  .inputValidator(z.object({ q: z.string().trim().min(2).max(80), lang: z.string().max(5).default("pt") }))
  .handler(async ({ data }) => {
    const [off, usda] = await Promise.allSettled([searchOFF(data.q, data.lang), searchUSDA(data.q)]);
    const a = off.status === "fulfilled" ? off.value : [];
    const b = usda.status === "fulfilled" ? usda.value : [];
    if (off.status === "rejected" && usda.status === "rejected") {
      console.error("food search failed", off.reason, usda.reason);
      throw new Error("Não foi possível buscar alimentos agora. Tente novamente.");
    }
    return { foods: [...a, ...b] };
  });
