import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { AppShell } from "@/components/AppShell";
import { Button } from '@/components/ui/button';
import { historyQuery, profileQuery, todayStr } from '@/lib/data';
import { progressSummary } from '@/lib/progress-data';
import { levelFor } from '@/lib/progress';
import { pageHead } from '@/lib/page-head';
import { cn } from '@/lib/utils';

export const Route = createFileRoute("/_authenticated/progresso")({
  head: () => pageHead('Seu progresso — NutriTrack', 'Calendário de metas calóricas concluídas, sequência e níveis conquistados.'),
  loader: async ({context}) => {await Promise.all([context.queryClient.ensureQueryData(historyQuery),context.queryClient.ensureQueryData(profileQuery)]);},
  component: Progress,
});

function Progress() {
  const {data: rows} = useSuspenseQuery(historyQuery);
  const {data: profile} = useSuspenseQuery(profileQuery);
  const [month,setMonth] = useState(startOfMonth(new Date()));
  const [selected,setSelected] = useState(todayStr());
  const goal = profile.goal?.calories ?? 0;
  const summary = progressSummary(rows,goal);
  const level = levelFor(summary.complete.size);
  const days = eachDayOfInterval({start: month, end: endOfMonth(month)});
  const calories = summary.totals.get(selected) ?? 0;
  return <AppShell header={<div><p className="text-xs font-medium text-primary">NutriTrack</p><h1 className="text-2xl font-bold">Seu progresso</h1></div>}>
    <div className="grid grid-cols-2 gap-4 border-b pb-5"><div><p className="flex items-center gap-1 text-sm text-muted-foreground"><Flame className="size-4 text-carbs" />Sequência atual</p><p className="mt-1 text-3xl font-bold">{summary.streak} <span className="text-sm font-normal">dias</span></p></div><div><p className="text-sm text-muted-foreground">Metas concluídas</p><p className="mt-1 text-3xl font-bold text-primary">{summary.complete.size} <span className="text-sm font-normal">dias</span></p></div></div>
    <section className="mt-5"><div className="mb-4 flex items-center justify-between"><Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => setMonth(m => addMonths(m,-1))}><ChevronLeft /></Button><h2 className="text-lg font-semibold capitalize">{format(month,'MMMM yyyy',{locale:ptBR})}</h2><Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => setMonth(m => addMonths(m,1))}><ChevronRight /></Button></div>
      <div className="grid grid-cols-7 gap-1 text-center">{['D','S','T','Q','Q','S','S'].map((d,i) => <span key={i} className="py-2 text-xs text-muted-foreground">{d}</span>)}</div>
      <div key={format(month,'yyyy-MM')} className="calendar-enter grid grid-cols-7 gap-1.5">{Array.from({length:getDay(month)},(_,i) => <span key={`blank-${i}`} />)}{days.map(day => {
        const key = format(day,'yyyy-MM-dd'), done = summary.complete.has(key), future = key > todayStr();
        return <Button key={key} variant="ghost" disabled={future} onClick={() => setSelected(key)} aria-label={`${format(day,'d MMMM',{locale:ptBR})}, ${done ? 'meta concluída' : summary.totals.has(key) ? 'meta não concluída' : 'sem registro'}`} aria-pressed={selected===key} className={cn('relative h-auto aspect-square min-w-0 flex-col gap-0 px-0 py-1 text-sm',done ? 'bg-primary-soft text-primary' : 'bg-muted',selected === key && 'ring-2 ring-primary',key===todayStr() && 'font-bold')}><span>{format(day,'d')}</span>{done ? <Check className="goal-check size-3" /> : <span className="h-3" />}</Button>;
      })}</div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Check className="size-4 text-primary" />Concluído: entre 90% e 110% da meta calórica.</p>
    </section>
    <section className="mt-6 border-y py-5"><p className="text-sm text-muted-foreground">{format(new Date(`${selected}T12:00:00`),"d 'de' MMMM",{locale:ptBR})}</p><div className="mt-2 flex items-center justify-between gap-2"><p className="text-xl font-bold">{Math.round(calories)} <span className="text-sm font-normal text-muted-foreground">/ {goal} kcal</span></p><span className={cn('text-xs font-semibold', summary.complete.has(selected) ? 'text-primary' : 'text-muted-foreground')}>{summary.complete.has(selected) ? '✓ Concluído' : calories > goal*1.1 ? 'Acima da meta' : calories ? 'Em progresso' : 'Sem registro'}</span></div><Button asChild variant="link" className="mt-2 px-0"><Link to="/diario" search={{date:selected}}>Ver diário deste dia</Link></Button></section>
    <section className="mt-5"><h2 className="font-semibold">{level.current?.emoji ?? '🌿'} {level.current?.label ?? 'Sua jornada começou'}</h2>{level.next && <><p className="mt-2 text-sm text-muted-foreground">Faltam {level.next.days-summary.complete.size} dias concluídos para {level.next.label}.</p><progress className="mt-3 h-2 w-full accent-primary" max={level.next.days} value={summary.complete.size} /></>}</section>
  </AppShell>;
}
