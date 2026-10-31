import { queryOptions } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { calcGoals, type Activity, type Objective, type Sex } from "./nutrition";

export const todayStr = () => format(new Date(), "yyyy-MM-dd");

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const id = await uid();
    const [{ data: profile, error }, { data: goal }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("goals").select("*").eq("user_id", id).maybeSingle(),
    ]);
    if (error) throw error;
    return { profile, goal };
  },
});

export const logsQuery = (date: string) =>
  queryOptions({
    queryKey: ["logs", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("log_date", date)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

export interface ProfileInput {
  full_name?: string | null;
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: Activity;
  country: string;
  objective: Objective;
}

export async function saveProfileAndGoals(input: ProfileInput, addWeightLog = false) {
  const id = await uid();
  const { objective, ...p } = input;
  const { error } = await supabase.from("profiles").update({ ...p, onboarded: true, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  const g = calcGoals(
    { sex: p.sex, age: p.age, heightCm: p.height_cm, weightKg: p.weight_kg, activity: p.activity_level },
    objective,
  );
  const { error: e2 } = await supabase.from("goals").upsert({
    user_id: id,
    objective,
    calories: g.calories,
    protein_g: g.protein,
    carbs_g: g.carbs,
    fat_g: g.fat,
    updated_at: new Date().toISOString(),
  });
  if (e2) throw e2;
  if (addWeightLog) await supabase.from("weight_logs").insert({ weight_kg: p.weight_kg, log_date: todayStr() });
  return g;
}

export async function addFoodLog(row: {
  food_name: string;
  brand?: string | null;
  image_url?: string | null;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal: string;
  log_date: string;
}) {
  const { error } = await supabase.from("food_logs").insert(row);
  if (error) throw error;
}
