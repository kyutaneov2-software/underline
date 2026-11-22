import type { Subject } from "../types";
import { getDb } from "./database";

type Row = {
  id: number;
  name: string;
  color: string;
  weekly_goal_min: number | null;
  exam_date: string | null;
};

const toSubject = (r: Row): Subject => ({
  id: r.id,
  name: r.name,
  color: r.color,
  weeklyGoalMin: r.weekly_goal_min,
  examDate: r.exam_date,
});

export async function getSubjects(): Promise<Subject[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    "SELECT id, name, color, weekly_goal_min, exam_date FROM subjects WHERE archived = 0 ORDER BY position, id",
  );
  return rows.map(toSubject);
}

export async function insertSubject(
  name: string,
  color: string,
  weeklyGoalMin: number | null,
  examDate: string | null,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ next: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM subjects",
  );
  const res = await db.runAsync(
    "INSERT INTO subjects (name, color, weekly_goal_min, exam_date, position) VALUES (?, ?, ?, ?, ?)",
    [name, color, weeklyGoalMin, examDate, row?.next ?? 0],
  );
  return res.lastInsertRowId;
}

export async function updateSubject(s: Subject): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE subjects SET name = ?, color = ?, weekly_goal_min = ?, exam_date = ? WHERE id = ?",
    [s.name, s.color, s.weeklyGoalMin, s.examDate, s.id],
  );
}

// Archiving hides a subject but keeps every session that used it.
export async function archiveSubject(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE subjects SET archived = 1 WHERE id = ?", [id]);
}
