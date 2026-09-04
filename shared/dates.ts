export function calendarDateKey(value: Date | string) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function entryDate(entry: { practiceDate?: string; createdAt: string }) {
  return entry.practiceDate ?? calendarDateKey(entry.createdAt);
}

export function validatePracticeDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Choose a valid work date");
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Choose a valid work date");
  }
  // Allow today in every time zone; the browser applies the local date limit.
  const latest = new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (value > latest) throw new Error("Work date cannot be in the future");
  return value;
}
