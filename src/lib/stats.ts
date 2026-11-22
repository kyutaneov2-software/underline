import { addDays, toDateKey } from "./dates";
import type { WeekRow } from "../db/sessions";

export type Segment = {
  key: string;
  name: string | null;
  color: string | null;
  seconds: number;
};
export type DayBar = {
  key: string;
  label: string;
  totalSec: number;
  segments: Segment[];
  isToday: boolean;
};
export type SubjectTotal = {
  key: string;
  name: string | null;
  color: string | null;
  seconds: number;
};
export type WeekSummary = {
  days: DayBar[];
  totalSec: number;
  subjects: SubjectTotal[];
};

// Consecutive days with at least one finished session. An empty today doesn't break the
// streak yet, since the day isn't over.
export function computeStreak(
  totals: Record<string, number>,
  now: Date,
): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = toDateKey(addDays(now, -i));
    if ((totals[key] ?? 0) > 0) streak += 1;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

// Turns the database rows into seven day bars (stacked by subject) and per-subject totals.
export function buildWeek(
  rows: WeekRow[],
  weekStart: Date,
  now: Date = new Date(),
): WeekSummary {
  const todayKey = toDateKey(now);
  const days: DayBar[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const key = toDateKey(d);
    const segments: Segment[] = rows
      .filter((r) => r.day === key)
      .map((r) => ({
        key: r.subjectId === null ? "none" : String(r.subjectId),
        name: r.name,
        color: r.color,
        seconds: r.seconds,
      }))
      .sort((a, b) => b.seconds - a.seconds);
    days.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      totalSec: segments.reduce((sum, s) => sum + s.seconds, 0),
      segments,
      isToday: key === todayKey,
    });
  }

  const bySubject = new Map<string, SubjectTotal>();
  rows.forEach((r) => {
    const key = r.subjectId === null ? "none" : String(r.subjectId);
    const existing = bySubject.get(key);
    if (existing) existing.seconds += r.seconds;
    else
      bySubject.set(key, {
        key,
        name: r.name,
        color: r.color,
        seconds: r.seconds,
      });
  });

  return {
    days,
    totalSec: days.reduce((sum, d) => sum + d.totalSec, 0),
    subjects: Array.from(bySubject.values()).sort(
      (a, b) => b.seconds - a.seconds,
    ),
  };
}
