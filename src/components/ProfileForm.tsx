import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITY, OBJECTIVES, calcGoals, type Activity, type Objective, type Sex } from "@/lib/nutrition";
import { COUNTRIES } from "@/lib/countries";
import type { ProfileInput } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  askCountryConfirm,
}: {
  initial: Partial<ProfileInput>;
  submitLabel: string;
  onSubmit: (v: ProfileInput) => Promise<void>;
  askCountryConfirm?: boolean;
}) {
  const [sex, setSex] = useState<Sex>(initial.sex ?? "female");
  const [age, setAge] = useState(String(initial.age ?? ""));
  const [height, setHeight] = useState(String(initial.height_cm ?? ""));
  const [weight, setWeight] = useState(String(initial.weight_kg ?? ""));
  const [activity, setActivity] = useState<Activity>(initial.activity_level ?? "light");
  const [objective, setObjective] = useState<Objective>(initial.objective ?? "maintain");
  const [country, setCountry] = useState(initial.country ?? "BR");
  const [changingCountry, setChangingCountry] = useState(!askCountryConfirm);
  const [saving, setSaving] = useState(false);

  const a = Number(age), h = Number(height), w = Number(weight);
  const valid = a >= 13 && a <= 100 && h >= 120 && h <= 230 && w >= 30 && w <= 300;
  const preview = valid ? calcGoals({ sex, age: a, heightCm: h, weightKg: w, activity }, objective) : null;
  const countryObj = COUNTRIES.find((c) => c.code === country);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await onSubmit({ sex, age: a, height_cm: h, weight_kg: w, activity_level: activity, country, objective });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Seu objetivo</h2>
        <div className="grid gap-3">
          {(Object.keys(OBJECTIVES) as Objective[]).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setObjective(k)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border-2 bg-card p-4 text-left transition-all",
                objective === k ? "border-primary bg-primary-soft shadow-card" : "border-border",
              )}
            >
              <span className="text-4xl">{OBJECTIVES[k].emoji}</span>
              <span>
                <span className="block font-semibold">{OBJECTIVES[k].label}</span>
                <span className="text-sm text-muted-foreground">{OBJECTIVES[k].desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Dados básicos</h2>
        <div className="grid grid-cols-2 gap-2">
          {(["female", "male"] as Sex[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSex(s)}
              className={cn(
                "rounded-xl border-2 py-3 font-medium",
                sex === s ? "border-primary bg-primary-soft text-primary" : "border-border bg-card",
              )}
            >
              {s === "female" ? "Feminino" : "Masculino"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="age">Idade</Label>
            <Input id="age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="h">Altura (cm)</Label>
            <Input id="h" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w">Peso (kg)</Label>
            <Input id="w" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(",", "."))} placeholder="70" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nível de atividade</Label>
          <Select value={activity} onValueChange={(v) => setActivity(v as Activity)}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(ACTIVITY) as Activity[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {ACTIVITY[k].label} — {ACTIVITY[k].desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">País</h2>
        {!changingCountry ? (
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Detectamos que você está em:</p>
            <p className="mt-1 text-xl font-semibold">{countryObj?.flag} {countryObj?.name}</p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">✓ Confirmado</span>
              <button type="button" onClick={() => setChangingCountry(true)} className="px-3 py-1.5 text-sm font-medium text-muted-foreground underline">
                Alterar
              </button>
            </div>
          </div>
        ) : (
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </section>

      {preview && (
        <section className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-card">
          <p className="text-sm opacity-90">Sua meta diária</p>
          <p className="font-display text-4xl font-bold">{preview.calories} kcal</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-background/15 py-2"><b>{preview.protein} g</b><br />Proteína</div>
            <div className="rounded-xl bg-background/15 py-2"><b>{preview.carbs} g</b><br />Carboidrato</div>
            <div className="rounded-xl bg-background/15 py-2"><b>{preview.fat} g</b><br />Gordura</div>
          </div>
        </section>
      )}

      <Button type="submit" size="lg" disabled={!valid || saving} className="h-14 w-full rounded-full text-base">
        {saving && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
      {!valid && <p className="text-center text-xs text-muted-foreground">Preencha idade, altura e peso para continuar.</p>}
    </form>
  );
}
