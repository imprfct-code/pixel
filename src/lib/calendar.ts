const EXACT_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function calendarDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function calendarDateLabel(value: Date | string) {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  const today = new Date();
  if (calendarDateKey(date) === calendarDateKey(today)) return "today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (calendarDateKey(date) === calendarDateKey(yesterday)) return "yesterday";

  return EXACT_DATE_FORMATTER.format(date).toLowerCase();
}
