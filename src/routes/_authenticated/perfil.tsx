import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { historyQuery, profileQuery, saveProfileAndGoals } from "@/lib/data";
import { progressSummary } from "@/lib/progress-data";
import { LEVELS, levelFor } from "@/lib/progress";
import { periodCategories } from "@/lib/categories";
import { pageHead } from "@/lib/page-head";
import type { Activity, Objective, Sex } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => pageHead("Seu perfil — NutriTrack", "Sua conta, categorias semanais, mensais e anuais e níveis conquistados."),
  loader: async ({ context }) => {
    await Promise.all([context.queryClient.ensureQueryData(historyQuery), context.queryClient.ensureQueryData(profileQuery)]);
  },
  component: Perfil,
});

function Perfil() {
  const qc = useQueryClient();
  const { data: rows } = useSuspenseQuery(historyQuery);
  const { data: pd } = useSuspenseQuery(profileQuery);
  const { data: user } = useQuery({ queryKey: ["auth-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const [editing, setEditing] = useState(false);
  const meta = user?.user_metadata ?? {};
  const name: string = meta.full_name || meta.name || pd.profile?.full_name || "Você";
  const photo: string | undefined = meta.avatar_url || meta.picture || pd.profile?.avatar_url || undefined;
  const goal = pd.goal?.calories ?? 0;
  const summary = progressSummary(rows, goal);
  const level = levelFor(summary.complete.size);
  const periods = periodCategories(summary.complete);
  const p = pd.profile;

  return (
    <AppShell header={<h1 className="text-2xl font-bold">Perfil</h1>}>
      <section className="flex flex-col items-center text-center">
        {photo ? (
          <img src={photo} alt={name} referrerPolicy="no-referrer" className="size-24 rounded-full object-cover ring-4 ring-primary-soft" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-primary-soft text-3xl font-bold text-primary">{name[0]}</div>
        )}
        <h2 className="mt-3 text-xl font-bold">{name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {level.current ? `${level.current.emoji} ${level.current.label}` : "Sem nível ainda"} · {summary.complete.size} metas concluídas
        </p>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 font-semibold">Suas categorias</h3>
        <div className="grid grid-cols-3 gap-2">
          {periods.map((x) => (
            <div key={x.key} className="calendar-enter rounded-2xl border bg-card p-3 text-center shadow-card">
              <p className="text-xs text-muted-foreground">{x.label}</p>
              <p className="text-3xl">{x.category.emoji}</p>
              <p className="font-semibold">{x.category.label}</p>
              <p className="text-xs text-muted-foreground">{x.done}/{x.days} dias</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Bronze &lt;40% · Prata 40% · Ouro 70% · Diamante 90% dos dias com a meta batida.</p>
      </section>

      <section className="mt-6">
        <h3 className="mb-3 font-semibold">Níveis</h3>
        <div className="space-y-2">
          {LEVELS.map((l) => {
            const got = summary.complete.size >= l.days;
            const pct = Math.min(100, (summary.complete.size / l.days) * 100);
            return (
              <div key={l.key} className={cn("rounded-2xl border p-3", got ? "border-primary bg-primary-soft" : "bg-card")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.emoji} {l.label}</span>
                  <span className="text-xs text-muted-foreground">{got ? "Conquistado" : `${summary.complete.size}/${l.days} dias`}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Seus dados e objetivo</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing((e) => !e)}><Pencil />{editing ? "Fechar" : "Editar"}</Button>
        </div>
        {editing && p ? (
          <ProfileForm
            initial={{
              sex: p.sex as Sex, age: p.age ?? undefined, height_cm: Number(p.height_cm) || undefined, weight_kg: Number(p.weight_kg) || undefined,
              activity_level: p.activity_level as Activity, country: p.country ?? "BR", objective: pd.goal?.objective as Objective,
            }}
            submitLabel="Salvar alterações"
            onSubmit={async (v) => {
              try { await saveProfileAndGoals(v, true); await qc.invalidateQueries(); toast.success("Perfil atualizado!"); setEditing(false); }
              catch { toast.error("Não foi possível salvar. Tente novamente."); }
            }}
          />
        ) : (
          <div className="rounded-2xl border bg-card p-4 text-sm">
            Meta diária: <b>{goal} kcal</b> · {p?.age} anos · {Number(p?.height_cm)} cm · {Number(p?.weight_kg)} kg
          </div>
        )}
      </section>

      <Button variant="outline" className="mt-6 w-full rounded-full" onClick={() => supabase.auth.signOut()}><LogOut />Sair</Button>
    </AppShell>
  );
}
