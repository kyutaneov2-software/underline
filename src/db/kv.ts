import { getDb } from './database';

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', [key]);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, JSON.stringify(value)]
  );
}