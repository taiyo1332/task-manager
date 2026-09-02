import type { RecurrenceType } from "@/types/task";
import { formatLocalDate } from "@/lib/date";

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function formatRecurrenceLabel(
  type: RecurrenceType | null,
  weekday: number | null
): string {
  if (type === "daily") return "毎日";
  if (type === "weekly") return `毎週${WEEKDAY_LABELS[weekday ?? 0]}曜日`;
  if (type === "monthly") return "毎月";
  return "";
}

export function computeNextDueDate(
  baseDate: string | null,
  type: RecurrenceType,
  weekday: number | null
): string {
  const base = baseDate ? new Date(`${baseDate}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);

  if (type === "daily") {
    base.setDate(base.getDate() + 1);
  } else if (type === "weekly") {
    if (weekday === null || weekday === undefined) {
      base.setDate(base.getDate() + 7);
    } else {
      let diff = (weekday - base.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      base.setDate(base.getDate() + diff);
    }
  } else if (type === "monthly") {
    base.setMonth(base.getMonth() + 1);
  }

  // Note: avoid toISOString() here — it converts to UTC and can roll the
  // date back (or forward) a day depending on the runtime's local timezone
  // offset relative to local midnight.
  return formatLocalDate(base);
}
