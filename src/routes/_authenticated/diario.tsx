import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, ErrorState, FoodImg } from "@/components/AppShell";
import { CalorieRing, MacroBar } from "@/components/Rings";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logsQuery, profileQuery, todayStr } from "@/lib/data";
import { MEALS } from "@/lib/food-types";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/diario")({
  validateSearch: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
  head: () => ({
    meta: [
      { title: "Diário — NutriTrack" },
      { name: "description", content: "Seu diário de calorias e macros do dia." },
      { property: "og:title", content: "Diário — NutriTrack" },
      { property: "og:description", content: "Seu diário de calorias e macros do dia." },
    ],
  }),
  component: Diary,
});

type Log = Tables<"food_logs">;

function Diary() {
  const { date: d } = Route.useSearch();
  const date = d ?? todayStr();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery(profileQuery);
  const logs = useQuery(logsQuery(date));
  const [editing, setEditing] = useState<Log | null>(null);

  const goal = profile.data?.goal;
  const items = logs.data ?? [];
  const sum = (k: "calories" | "protein_g" | "carbs_g" | "fat_g") => items.reduce((a, b) => a + Number(b[k]), 0);
  const shift = (n: number) => navigate({ to: "/diario", search: { date: format(addDays(parseISO(date), n), "yyyy-MM-dd") } });
  const isToday = date === todayStr();

  const remove = async (id: string) => {
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) { toast.error("Não foi possível remover."); return; }
    toast.success("Item removido");
    qc.invalidateQueries({ queryKey: ["logs"] });
  };

  return (
    <AppShell
      header={
        <div className="space-y-3">
          <Link to="/buscar" search={{ date }} className="flex h-12 items-center gap-3 rounded-full bg-muted px-4 text-muted-foreground">
            <Search className="size-5" /> Buscar alimento…
          </Link>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Dia anterior"><ChevronLeft /></Button>
            <div className="text-center">
              <p className="font-semibold capitalize">{isToday ? "Hoje" : format(parseISO(date), "EEEE", { locale: ptBR })}</p>
              <p className="text-xs text-muted-foreground">{format(parseISO(date), "d 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Próximo dia"><ChevronRight /></Button>
          </div>
        </div>
      }
    >
      {profile.isError || logs.isError ? (
        <ErrorState message="Não foi possível carregar seu diário." onRetry={() => { profile.refetch(); logs.refetch(); }} />
      ) : !goal || logs.isLoading ? (
        <div className="space-y-4"><Skeleton className="h-56 rounded-3xl" /><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
      ) : (
        <>
          <section className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card">
            <CalorieRing consumed={sum("calories")} goal={goal.calories} />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Consumido</p>
                <p className="font-display text-xl font-bold">{Math.round(sum("calories"))} <span className="text-sm font-normal text-muted-foreground">/ {goal.calories}</span></p>
              </div>
              <MacroBar label="Proteína" value={sum("protein_g")} goal={goal.protein_g} colorClass="bg-protein" />
              <MacroBar label="Carboidrato" value={sum("carbs_g")} goal={goal.carbs_g} colorClass="bg-carbs" />
              <MacroBar label="Gordura" value={sum("fat_g")} goal={goal.fat_g} colorClass="bg-fat" />
            </div>
          </section>

          <div className="mt-6 space-y-4">
            {MEALS.map((m) => {
              const list = items.filter((i) => i.meal === m.key);
              const kcal = list.reduce((a, b) => a + Number(b.calories), 0);
              return (
                <section key={m.key} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{m.emoji} {m.label}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{Math.round(kcal)} kcal</span>
                      <Link to="/buscar" search={{ date, meal: m.key }} className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary" aria-label={`Adicionar em ${m.label}`}>
                        <Plus className="size-4" />
                      </Link>
                    </div>
                  </div>
                  {list.length > 0 && (
                    <ul className="mt-3 divide-y">
                      {list.map((i) => (
                        <li key={i.id} className="flex items-center gap-3 py-2.5">
                          <FoodImg src={i.image_url} alt={i.food_name} className="size-12 shrink-0 rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{i.food_name}</p>
                            <p className="text-xs text-muted-foreground">{Math.round(Number(i.quantity_g))} g · {Math.round(Number(i.calories))} kcal</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(i)} aria-label="Editar"><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(i.id)} aria-label="Remover"><Trash2 className="size-4 text-destructive" /></Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
      <EditDialog log={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function EditDialog({ log, onClose }: { log: Log | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState("");
  const [meal, setMeal] = useState("");
  const [saving, setSaving] = useState(false);
  const open = !!log;

  const save = async () => {
    if (!log) return;
    const q = Number(qty || log.quantity_g);
    if (!(q > 0)) { toast.error("Quantidade inválida"); return; }
    const f = q / Number(log.quantity_g);
    setSaving(true);
    const { error } = await supabase.from("food_logs").update({
      quantity_g: q,
      calories: Number(log.calories) * f,
      protein_g: Number(log.protein_g) * f,
      carbs_g: Number(log.carbs_g) * f,
      fat_g: Number(log.fat_g) * f,
      meal: meal || log.meal,
    }).eq("id", log.id);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Item atualizado");
    qc.invalidateQueries({ queryKey: ["logs"] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setQty(""); setMeal(""); } }}>
      <DialogContent className="rounded-3xl">
        <DialogHeader><DialogTitle>{log?.food_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block text-sm font-medium">Quantidade (g)
            <Input className="mt-1.5" inputMode="decimal" defaultValue={log ? String(Math.round(Number(log.quantity_g))) : ""} onChange={(e) => setQty(e.target.value.replace(",", "."))} />
          </label>
          <Select defaultValue={log?.meal ?? "snack"} onValueChange={setMeal}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MEALS.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter><Button onClick={save} disabled={saving} className="rounded-full">Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
