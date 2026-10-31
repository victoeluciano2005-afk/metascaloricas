import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface Suggestion {
  name: string;
  description: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_g: number;
  image: string | null;
}

async function findImage(keyword: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(keyword)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    const data = (await res.json()) as { meals?: { strMealThumb: string }[] | null };
    if (data.meals?.[0]) return data.meals[0].strMealThumb;
    const first = keyword.split(" ")[0];
    const r2 = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(first)}`, {
      signal: AbortSignal.timeout(5000),
    });
    const d2 = (await r2.json()) as { meals?: { strMealThumb: string }[] | null };
    return d2.meals?.[0]?.strMealThumb ?? null;
  } catch {
    return null;
  }
}

export const getSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      country: z.string().max(60),
      objective: z.enum(["lose", "maintain", "gain"]),
      calories: z.number().min(800).max(6000),
    }),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Serviço de sugestões indisponível.");
    const goal = { lose: "perder peso", maintain: "manter o peso", gain: "ganhar massa" }[data.objective];
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você é um nutricionista. Responda em português do Brasil. Sugira refeições típicas, reais e saudáveis do país informado, com valores nutricionais realistas por porção.",
          },
          {
            role: "user",
            content: `País: ${data.country}. Objetivo: ${goal}. Meta diária: ${data.calories} kcal. Sugira 8 refeições (2 café da manhã, 2 almoço, 2 jantar, 2 lanche) com porções que caibam na meta.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_meals",
              parameters: {
                type: "object",
                properties: {
                  meals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string", description: "1 frase curta" },
                        meal: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
                        calories: { type: "number" },
                        protein: { type: "number" },
                        carbs: { type: "number" },
                        fat: { type: "number" },
                        serving_g: { type: "number" },
                        image_keyword: { type: "string", description: "Nome do prato ou ingrediente principal em inglês, 1-2 palavras" },
                      },
                      required: ["name", "description", "meal", "calories", "protein", "carbs", "fat", "serving_g", "image_keyword"],
                    },
                  },
                },
                required: ["meals"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_meals" } },
      }),
    });
    if (res.status === 429) throw new Error("Muitas solicitações. Aguarde um instante e tente de novo.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) {
      console.error("AI error", res.status, await res.text());
      throw new Error("Não foi possível gerar sugestões agora.");
    }
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = JSON.parse(args ?? "{}") as { meals?: (Omit<Suggestion, "image"> & { image_keyword: string })[] };
    const meals = parsed.meals ?? [];
    const withImages: Suggestion[] = await Promise.all(
      meals.map(async ({ image_keyword, ...m }) => ({ ...m, image: await findImage(image_keyword) })),
    );
    return { meals: withImages };
  });
