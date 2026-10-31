export function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const over = consumed > goal;
  const left = Math.round(goal - consumed);
  return (
    <div className="relative size-44">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="14" className="stroke-muted" />
        <circle
          cx="80" cy="80" r={r} fill="none" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          className={over ? "stroke-destructive transition-all duration-700" : "stroke-primary transition-all duration-700"}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl font-bold">{Math.abs(left)}</span>
        <span className="text-xs text-muted-foreground">{over ? "kcal acima" : "kcal restantes"}</span>
      </div>
    </div>
  );
}

export function MacroBar({ label, value, goal, colorClass }: { label: string; value: number; goal: number; colorClass: string }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{Math.round(value)}/{goal} g</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
