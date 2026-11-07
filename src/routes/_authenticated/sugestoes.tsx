import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell, FoodImg } from "@/components/AppShell";
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { historyQuery, profileQuery, logsQuery, todayStr } from '@/lib/data';
import { MEALS, type MealKey } from '@/lib/food-types';
import { buildPlate, type Plate } from '@/lib/personalized-plates';
import { formatQty } from '@/lib/units';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute("/_authenticated/sugestoes")({
  head: () => pageHead('Sugestões para você — NutriTrack', 'Pratos personalizados com seus alimentos habituais e sua meta calórica.'),
  loader: async ({context}) => { await Promise.all([context.queryClient.ensureQueryData(historyQuery), context.queryClient.ensureQueryData(profileQuery), context.queryClient.ensureQueryData(logsQuery(todayStr()))]); },
  component: Suggestions,
});

function Suggestions() {
  const {data: history} = useSuspenseQuery(historyQuery);
  const {data: profile} = useSuspenseQuery(profileQuery);
  const {data: logs} = useSuspenseQuery(logsQuery(todayStr()));
  const [meal, setMeal] = useState<MealKey>('lunch');
  const [variation, setVariation] = useState(0);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const goal = profile.goal?.calories ?? 0;
  const consumed = logs.reduce((s,i) => s + Number(i.calories),0);
  const remaining = Math.max(0,goal-consumed);
  const plate = buildPlate(history, meal, goal, remaining, todayStr(), variation);
  const add = async (p: Plate) => {
    setSaving(true);
    try {
      const {error} = await supabase.from('food_logs').insert(p.items.map(i => ({ food_name: i.name, quantity_g: i.grams, calories: i.calories, protein_g: i.protein, carbs_g: i.carbs, fat_g: i.fat, meal, log_date: todayStr() })));
      if (error) throw error;
      await qc.invalidateQueries({queryKey:['logs']});
      toast.success('Prato adicionado ao diário');
      navigate({to:'/diario'});
    } catch { toast.error('Não foi possível adicionar o prato. Tente novamente.'); }
    finally { setSaving(false); }
  };
  return <AppShell header={<div><p className="text-xs font-medium text-primary">NutriTrack</p><h1 className="text-2xl font-bold">Seu próximo prato</h1></div>}>
    <div className="flex items-baseline justify-between border-b pb-4"><span className="text-sm text-muted-foreground">Restam hoje</span><p className="text-2xl font-bold">{Math.round(remaining)} <span className="text-sm font-normal">kcal</span></p></div>
    <div className="my-5 grid grid-cols-2 gap-2" role="group" aria-label="Refeição">{MEALS.map(m => <Button key={m.key} variant={meal === m.key ? 'default' : 'outline'} onClick={() => {setMeal(m.key);setVariation(0);}}>{m.emoji} {m.label}</Button>)}</div>
    {plate ? <section>
      <div className="flex items-center justify-between"><h2 className="font-semibold">{plate.familiar ? 'Com seus favoritos' : 'Uma combinação para hoje'}</h2><Button variant="ghost" size="icon" onClick={() => setVariation(v => v+1)} aria-label="Variar prato" title="Variar prato"><RefreshCw /></Button></div>
      <div className="plate-scene mx-auto my-6 grid aspect-square w-full max-w-64 grid-cols-2 place-items-center rounded-full border-[12px] border-card bg-muted shadow-card">{plate.items.map(i => <FoodImg key={i.name} alt={i.name} className="size-16 text-lg" />)}</div>
      <ul className="divide-y">{plate.items.map(i => <li key={i.name} className="flex items-center gap-3 py-3"><FoodImg alt={i.name} className="size-10 shrink-0" /><span className="min-w-0 flex-1 text-sm font-medium">{i.name}</span><span className="shrink-0 text-sm text-muted-foreground">{formatQty(i.grams, i.name)}</span></li>)}</ul>
      <div className="my-5 border-y py-4"><p className="text-2xl font-bold">{Math.round(plate.calories)} <span className="text-sm font-normal text-muted-foreground">kcal por prato</span></p><p className="mt-2 text-sm text-muted-foreground">P {Math.round(plate.protein)} g · C {Math.round(plate.carbs)} g · G {Math.round(plate.fat)} g</p></div>
      <Button className="h-12 w-full" disabled={saving} onClick={() => add(plate)}><Plus />{saving ? 'Adicionando…' : 'Adicionar prato ao diário'}</Button>
      <p className="mt-3 text-xs text-muted-foreground">Valores nutricionais estimados.</p>
    </section> : <div className="py-12 text-center"><p className="text-4xl">🌿</p><h2 className="mt-4 text-xl font-bold">Meta calórica atingida</h2><p className="mt-2 text-sm text-muted-foreground">Seu diário de hoje já alcançou a meta.</p></div>}
  </AppShell>;
}
