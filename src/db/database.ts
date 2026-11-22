import * as SQLite from 'expo-sqlite';

const DB_NAME = 'underline.db';

// Add new migrations to the END of this list. Never edit one that has already shipped.
// PRAGMA user_version records how many have been applied.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS subjects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    color           TEXT    NOT NULL,
    weekly_goal_min INTEGER,                      -- null = no weekly goal
    exam_date       TEXT,                         -- 'YYYY-MM-DD', null = no exam
    position        INTEGER NOT NULL DEFAULT 0,
    archived        INTEGER NOT NULL DEFAULT 0    -- archived subjects keep their history
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at   INTEGER NOT NULL,                -- unix ms
    duration_sec INTEGER NOT NULL,
    subject_id   INTEGER REFERENCES subjects (id),
    completed    INTEGER NOT NULL DEFAULT 1       -- 1 = finished, 0 = stopped early
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions (started_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_subject ON sessions (subject_id);

  CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  INSERT INTO subjects (name, color, position) VALUES ('General', '#2F6FED', 0);
  `,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = openAndMigrate();
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let i = current; i < MIGRATIONS.length; i++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[i]);
      await db.execAsync(`PRAGMA user_version = ${i + 1}`);
    });
  }
  return db;
}