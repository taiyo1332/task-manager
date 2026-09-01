import type { Priority, TaskStatus } from "@/types/task";

export const PRIORITY_LABEL: Record<Priority, string> = {
  1: "高",
  2: "中",
  3: "低",
};

export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  1: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20",
  2: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20",
  3: "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-600/20",
};

export const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  未着手: "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-500/20",
  進行中: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20",
  完了: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20",
};

export const STATUS_OPTIONS: TaskStatus[] = ["未着手", "進行中", "完了"];

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "完了") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}
