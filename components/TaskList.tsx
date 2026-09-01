"use client";

import type { Task, TaskStatus } from "@/types/task";
import {
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABEL,
  STATUS_BADGE_CLASS,
  STATUS_OPTIONS,
  isOverdue,
} from "@/lib/priority";

export default function TaskList({
  tasks,
  onStatusChange,
}: {
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
        タスクがまだありません。上のフォームから追加してください。
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <th className="px-4 py-3">優先度</th>
            <th className="px-4 py-3">タスク名</th>
            <th className="px-4 py-3">担当者</th>
            <th className="px-4 py-3">期限</th>
            <th className="px-4 py-3">ステータス</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => {
            const overdue = isOverdue(task.due_date, task.status);
            return (
              <tr
                key={task.id}
                className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASS[task.priority]}`}
                  >
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {task.title}
                  {task.ai_reason && (
                    <p className="mt-0.5 text-xs font-normal text-zinc-400">
                      {task.ai_reason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {task.assignee || "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={overdue ? "font-semibold text-red-600" : "text-zinc-600 dark:text-zinc-400"}>
                    {task.due_date || "-"}
                    {overdue && " (期限超過)"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      onStatusChange(task.id, e.target.value as TaskStatus)
                    }
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400 ${STATUS_BADGE_CLASS[task.status]}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
