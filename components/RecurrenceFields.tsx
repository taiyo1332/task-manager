"use client";

import type { RecurrenceInput, RecurrenceType } from "@/types/task";
import { WEEKDAY_LABELS } from "@/lib/recurrence";

export default function RecurrenceFields({
  value,
  onChange,
}: {
  value: RecurrenceInput;
  onChange: (value: RecurrenceInput) => void;
}) {
  const { is_recurring, recurrence_type, recurrence_weekday } = value;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={is_recurring}
          onChange={(e) =>
            onChange({
              is_recurring: e.target.checked,
              recurrence_type: recurrence_type ?? "weekly",
              recurrence_weekday: recurrence_weekday ?? new Date().getDay(),
            })
          }
          className="h-4 w-4 rounded border-zinc-300"
        />
        繰り返し
      </label>
      {is_recurring && (
        <div className="flex flex-wrap gap-2 pl-6">
          <select
            value={recurrence_type ?? "weekly"}
            onChange={(e) =>
              onChange({
                is_recurring,
                recurrence_type: e.target.value as RecurrenceType,
                recurrence_weekday: recurrence_weekday ?? new Date().getDay(),
              })
            }
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="daily">毎日</option>
            <option value="weekly">毎週</option>
            <option value="monthly">毎月</option>
          </select>
          {recurrence_type === "weekly" && (
            <select
              value={recurrence_weekday ?? new Date().getDay()}
              onChange={(e) =>
                onChange({
                  is_recurring,
                  recurrence_type,
                  recurrence_weekday: Number(e.target.value),
                })
              }
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            >
              {WEEKDAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  毎週{label}曜日
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
