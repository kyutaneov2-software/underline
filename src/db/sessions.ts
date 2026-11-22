import type { Session } from "../types";
import { getDb } from "./database";

// Tiny event hook so screens refresh when a session is saved or deleted.
const listeners = new Set<() => void>();

export function onSessionsChanged(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notify(): void {
  listeners.forEach((cb) => cb());
}

type Row = {
  id: number;
  started_at: number;
  duration_sec: number;
  subject_id: number | null;
  completed: number;
};

export type NewSession = {
  startedAt: number;
  durationSec: number;
  subjectId: number | null;
  completed: boolean;
};

export async function insertSession(s: NewSession): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO sessions (started_at, duration_sec, subject_id, completed) VALUES (?, ?, ?, ?)",
    [s.startedAt, s.durationSec, s.subjectId, s.completed ? 1 : 0],
  );
  notify();
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM sessions WHERE id = ?", [id]);
  notify();
}

export async function getRecentSessions(limit = 200): Promise<Session[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT id, started_at, duration_sec, subject_id, completed FROM sessions ORDER BY started_at DESC LIMIT ?",
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    durationSec: r.duration_sec,
    subjectId: r.subject_id,
    completed: r.completed === 1,
  }));
}

// Total completed focus seconds since a given time (unix ms).
export async function getFocusSecondsSince(sinceMs: number): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(duration_sec), 0) AS total FROM sessions WHERE completed = 1 AND started_at >= ?",
    [sinceMs],
  );
  return row?.total ?? 0;
}

// Completed focus seconds per local calendar day, keyed 'YYYY-MM-DD'.
export async function getDailyTotals(
  sinceMs: number,
): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string; total: number }>(
    `SELECT date(started_at / 1000, 'unixepoch', 'localtime') AS day,
            SUM(duration_sec) AS total
       FROM sessions
      WHERE completed = 1 AND started_at >= ?
      GROUP BY day`,
    [sinceMs],
  );
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    map[r.day] = r.total;
  });
  return map;
}
