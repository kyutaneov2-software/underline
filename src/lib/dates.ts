const pad = (n: number) => String(n).padStart(2, "0");

// Dates are stored as local calendar days, 'YYYY-MM-DD', so time zones never shift them.
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Whole days from today to the given day. 0 = today, negative = in the past.
export function daysUntil(key: string, now: Date = new Date()): number {
  const t = parseDateKey(key);
  const a = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

// Midnight at the start of the week containing `date`. weekStartsOn: 0 = Sunday, 1 = Monday.
export function startOfWeek(date: Date, weekStartsOn: number): Date {
  const diff = (date.getDay() - weekStartsOn + 7) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff);
}

export function formatDateLong(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// "Nov 16 - 22" or "Nov 30 - Dec 6" for the week starting at `start`.
export function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const month = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short" });
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${month(start)} ${start.getDate()} - ${end.getDate()}`
    : `${month(start)} ${start.getDate()} - ${month(end)} ${end.getDate()}`;
}
