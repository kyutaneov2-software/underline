import { useCallback, useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { getDailyTotals, getWeekRows, onSessionsChanged } from "../db/sessions";
import { addDays, startOfWeek } from "../lib/dates";
import { buildWeek, computeStreak, type WeekSummary } from "../lib/stats";

export type WeekData = WeekSummary & { start: Date; streak: number };

// offset 0 = this week, -1 = last week, and so on.
export function useWeekData(offset: number): WeekData | null {
  const { settings } = useSettings();
  const weekStartsOn = settings.weekStartsOn;
  const [data, setData] = useState<WeekData | null>(null);

  const load = useCallback(async () => {
    const now = new Date();
    const start = addDays(startOfWeek(now, weekStartsOn), offset * 7);
    const end = addDays(start, 7);
    const yearAgo = addDays(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      -365,
    );
    const [rows, totals] = await Promise.all([
      getWeekRows(start.getTime(), end.getTime()),
      getDailyTotals(yearAgo.getTime()),
    ]);
    setData({
      ...buildWeek(rows, start, now),
      start,
      streak: computeStreak(totals, now),
    });
  }, [offset, weekStartsOn]);

  useEffect(() => {
    load();
    return onSessionsChanged(load);
  }, [load]);

  return data;
}
