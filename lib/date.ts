// Avoid Date#toISOString() for local calendar dates — it converts to UTC and
// can roll the date back (or forward) a day depending on the runtime's local
// timezone offset relative to local midnight.
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalDate(): string {
  return formatLocalDate(new Date());
}
