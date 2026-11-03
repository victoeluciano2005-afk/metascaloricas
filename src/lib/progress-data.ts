import { format, subDays } from 'date-fns';
import { currentStreak, isDayComplete } from './progress';
import { dailyTotals } from './data';

export function progressSummary(rows: {log_date: string; calories: number}[], goal: number, today = new Date()) {
  const totals = dailyTotals(rows);
  const todayKey = format(today, 'yyyy-MM-dd');
  const complete = new Set([...totals].filter(([d,k]) => d <= todayKey && isDayComplete(k, goal)).map(([d]) => d));
  const recent = Array.from({length: 7}, (_,i) => format(subDays(today, i), 'yyyy-MM-dd'));
  const lastLog = [...totals.keys()].filter(d => d <= todayKey).sort().at(-1);
  const last = lastLog ? new Date(`${lastLog}T12:00:00`) : null;
  const daysSinceLastLog = last ? Math.max(0, Math.round((new Date(`${todayKey}T12:00:00`).getTime()-last.getTime())/86400000)) : 30;
  return { totals, complete, streak: currentStreak(complete, today), completionRate: recent.filter(d => complete.has(d)).length / 7, daysSinceLastLog };
}