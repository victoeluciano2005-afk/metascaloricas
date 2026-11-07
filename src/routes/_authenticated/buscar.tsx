import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, ErrorState, FoodImg } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchFoods } from "@/lib/food.functions";
import { addFoodLog, todayStr } from "@/lib/data";
import { MEALS, type Food } from "@/lib/food-types";
import { qtyUnit } from "@/lib/units";

export const Route = createFileRoute("/_authenticated/buscar")({
  validateSearch: z.object({ date: z.string().optional(), meal: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Buscar alimentos — NutriTrack" },
      { name: "description", content: "Busque alimentos com foto, calorias e macros." },
      { property: "og:title", content: "Buscar alimentos — NutriTrack" },
      { property: "og:description", content: "Busque alimentos com foto, calorias e macros." },
    ],
  }),
  component: BuscarPage,
});

const SUGGESTED = ["Arroz", "Feijão", "Frango", "Ovo", "Banana", "Pão francês", "Leite", "Iogurte"];

function BuscarPage() {
  const { date, meal } = Route.useSearch();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Food | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 450);
    return () => clearTimeout(t);
  }, [text]);

  const res = useQuery({
    queryKey: ["foods", q],
    queryFn: () => searchFoods({ data: { q, lang: "pt" } }),
    enabled: q.length >= 2,
    staleTime: 5 * 60_000,
  });
  const generic = res.data?.generic ?? [];
  const products = res.data?.products ?? [];
  const total = generic.length + products.length;

  return (
    <AppShell
      header={
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Buscar alimento (ex: arroz, banana)"
            className="h-12 rounded-full pl-12"
          />
          {res.isFetching && <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
      }
    >
      {q.length < 2 ? (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">Sugestões rápidas</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button key={s} onClick={() => setText(s)} className="rounded-full bg-primary-soft px-4 py-2 text-sm font-medium text-primary">
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : res.isError ? (
        <ErrorState message={(res.error as Error).message || "Erro na busca."} onRetry={() => res.refetch()} />
      ) : res.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : total === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Nenhum alimento encontrado para "{q}".</p>
      ) : (
        <div className="space-y-6">
          {generic.length > 0 && <FoodList title="Alimentos" foods={generic} onPick={setPicked} />}
          {products.length > 0 && <FoodList title="Produtos industrializados" foods={products} onPick={setPicked} />}
        </div>
      )}
      <AddDialog food={picked} onClose={() => setPicked(null)} date={date ?? todayStr()} meal={meal} />
    </AppShell>
  );
}

function FoodList({ title, foods, onPick }: { title: string; foods: Food[]; onPick: (f: Food) => void }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
      <ul className="space-y-3">
        {foods.map((f) => (
          <li key={f.id}>
            <button onClick={() => onPick(f)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card">
              <FoodImg alt={f.name} className="size-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{f.name}</p>
                {f.brand && <p className="truncate text-xs text-muted-foreground">{f.brand}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  P {f.protein.toFixed(1)}g · C {f.carbs.toFixed(1)}g · G {f.fat.toFixed(1)}g
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold">{f.kcal}</p>
                <p className="text-[10px] text-muted-foreground">kcal/100g</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddDialog({ food, onClose, date, meal }: { food: Food | null; onClose: () => void; date: string; meal?: string | undefined }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [qty, setQty] = useState("100");
  const [m, setM] = useState(meal ?? "lunch");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (food) { setQty(String(Math.round(food.servingG ?? 100))); setM(meal ?? "lunch"); }
  }, [food, meal]);

  const g = Number(qty.replace(",", ".")) || 0;
  const f = g / 100;

  const save = async () => {
    if (!food || !(g > 0)) { toast.error("Informe uma quantidade válida"); return; }
    setSaving(true);
    try {
      await addFoodLog({
        food_name: food.name, brand: food.brand, image_url: null, quantity_g: g,
        calories: food.kcal * f, protein_g: food.protein * f, carbs_g: food.carbs * f, fat_g: food.fat * f,
        meal: m, log_date: date,
      });
      toast.success("Alimento adicionado!");
      qc.invalidateQueries({ queryKey: ["logs"] });
      onClose();
      navigate({ to: "/diario", search: { date } });
    } catch {
      toast.error("Não foi possível adicionar.");
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!food} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl">
        {food && (
          <>
            <DialogHeader><DialogTitle className="text-left">{food.name}</DialogTitle></DialogHeader>
            <FoodImg alt={food.name} className="h-32 w-full text-[2rem]" />
            <div className="grid grid-cols-4 gap-2 text-center">
              {[["kcal", food.kcal * f], ["Prot", food.protein * f], ["Carb", food.carbs * f], ["Gord", food.fat * f]].map(([l, v]) => (
                <div key={l as string} className="rounded-xl bg-muted p-2">
                  <p className="font-bold">{Math.round(v as number)}</p>
                  <p className="text-[11px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
            <label className="block text-sm font-medium">Quantidade ({qtyUnit(food.name)})
              <Input className="mt-1.5" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            </label>
            <Select value={m} onValueChange={setM}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEALS.map((x) => <SelectItem key={x.key} value={x.key}>{x.emoji} {x.label}</SelectItem>)}</SelectContent>
            </Select>
            <DialogFooter><Button onClick={save} disabled={saving} className="w-full rounded-full">Adicionar ao diário</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
