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

// Completed focus seconds per subject since a given time (unix ms), keyed by subject id.
export async function getFocusSecondsBySubject(
  sinceMs: number,
): Promise<Record<number, number>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ subject_id: number; total: number }>(
    `SELECT subject_id, SUM(duration_sec) AS total
       FROM sessions
      WHERE completed = 1 AND subject_id IS NOT NULL AND started_at >= ?
      GROUP BY subject_id`,
    [sinceMs],
  );
  const map: Record<number, number> = {};
  rows.forEach((r) => {
    map[r.subject_id] = r.total;
  });
  return map;
}

export type WeekRow = {
  day: string; // 'YYYY-MM-DD'
  subjectId: number | null;
  name: string | null;
  color: string | null;
  seconds: number;
};

// Completed focus seconds per day and subject in [startMs, endMs). The join keeps names and
// colors of subjects that were archived later, so old weeks still read correctly.
export async function getWeekRows(
  startMs: number,
  endMs: number,
): Promise<WeekRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    day: string;
    subject_id: number | null;
    name: string | null;
    color: string | null;
    total: number;
  }>(
    `SELECT date(s.started_at / 1000, 'unixepoch', 'localtime') AS day,
            s.subject_id AS subject_id,
            sub.name AS name,
            sub.color AS color,
            SUM(s.duration_sec) AS total
       FROM sessions s
       LEFT JOIN subjects sub ON sub.id = s.subject_id
      WHERE s.completed = 1 AND s.started_at >= ? AND s.started_at < ?
      GROUP BY day, s.subject_id`,
    [startMs, endMs],
  );
  return rows.map((r) => ({
    day: r.day,
    subjectId: r.subject_id,
    name: r.name,
    color: r.color,
    seconds: r.total,
  }));
}

export type SessionLogItem = {
  id: number;
  startedAt: number;
  durationSec: number;
  completed: boolean;
  subjectName: string | null;
  subjectColor: string | null;
};

export async function getSessionLog(limit = 300): Promise<SessionLogItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    started_at: number;
    duration_sec: number;
    completed: number;
    name: string | null;
    color: string | null;
  }>(
    `SELECT s.id, s.started_at, s.duration_sec, s.completed, sub.name AS name, sub.color AS color
       FROM sessions s
       LEFT JOIN subjects sub ON sub.id = s.subject_id
      ORDER BY s.started_at DESC
      LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    durationSec: r.duration_sec,
    completed: r.completed === 1,
    subjectName: r.name,
    subjectColor: r.color,
  }));
}
