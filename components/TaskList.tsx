"use client";

import { useState, type FormEvent } from "react";
import type { Priority, RecurrenceInput, Subtask, Task, TaskStatus } from "@/types/task";
import {
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABEL,
  STATUS_BADGE_CLASS,
  STATUS_OPTIONS,
  isOverdue,
} from "@/lib/priority";
import { formatRecurrenceLabel } from "@/lib/recurrence";
import RecurrenceFields from "@/components/RecurrenceFields";

type TaskEditUpdates = {
  title: string;
  assignee: string | null;
  due_date: string | null;
} & RecurrenceInput;

const PRIORITY_OPTIONS: Priority[] = [1, 2, 3];

export default function TaskList({
  tasks,
  subtasksByTask,
  onStatusChange,
  onPriorityChange,
  onSuggestedDateChange,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onMoveSubtask,
  onBreakdown,
  breakdownLoadingId,
}: {
  tasks: Task[];
  subtasksByTask: Record<number, Subtask[]>;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onPriorityChange: (id: number, priority: Priority) => void;
  onSuggestedDateChange: (id: number, suggestedDate: string) => void;
  onUpdateTask: (id: number, updates: TaskEditUpdates) => void;
  onDeleteTask: (id: number) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: number, done: boolean) => void;
  onDeleteSubtask: (subtaskId: string, taskId: number) => void;
  onMoveSubtask: (taskId: number, subtaskId: string, direction: "up" | "down") => void;
  onBreakdown: (taskId: number) => void;
  breakdownLoadingId: number | null;
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
            <th className="w-8 px-2 py-3" />
            <th className="px-4 py-3">優先度</th>
            <th className="px-4 py-3">タスク名</th>
            <th className="px-4 py-3">担当者</th>
            <th className="px-4 py-3">期限</th>
            <th className="px-4 py-3">AI提案日</th>
            <th className="px-4 py-3">ステータス</th>
            <th className="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              subtasks={subtasksByTask[task.id] ?? []}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
              onSuggestedDateChange={onSuggestedDateChange}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onMoveSubtask={onMoveSubtask}
              onBreakdown={onBreakdown}
              breakdownLoading={breakdownLoadingId === task.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskRow({
  task,
  subtasks,
  onStatusChange,
  onPriorityChange,
  onSuggestedDateChange,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onMoveSubtask,
  onBreakdown,
  breakdownLoading,
}: {
  task: Task;
  subtasks: Subtask[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onPriorityChange: (id: number, priority: Priority) => void;
  onSuggestedDateChange: (id: number, suggestedDate: string) => void;
  onUpdateTask: (id: number, updates: TaskEditUpdates) => void;
  onDeleteTask: (id: number) => void;
  onAddSubtask: (taskId: number, title: string) => void;
  onToggleSubtask: (subtaskId: string, taskId: number, done: boolean) => void;
  onDeleteSubtask: (subtaskId: string, taskId: number) => void;
  onMoveSubtask: (taskId: number, subtaskId: string, direction: "up" | "down") => void;
  onBreakdown: (taskId: number) => void;
  breakdownLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editAssignee, setEditAssignee] = useState(task.assignee ?? "");
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? "");
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceInput>({
    is_recurring: task.is_recurring,
    recurrence_type: task.recurrence_type,
    recurrence_weekday: task.recurrence_weekday,
  });
  const overdue = isOverdue(task.due_date, task.status);
  const doneCount = subtasks.filter((s) => s.done).length;
  const total = subtasks.length;

  function startEditing() {
    setEditTitle(task.title);
    setEditAssignee(task.assignee ?? "");
    setEditDueDate(task.due_date ?? "");
    setEditRecurrence({
      is_recurring: task.is_recurring,
      recurrence_type: task.recurrence_type,
      recurrence_weekday: task.recurrence_weekday,
    });
    setEditing(true);
  }

  function handleSave() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return;
    onUpdateTask(task.id, {
      title: trimmedTitle,
      assignee: editAssignee.trim() || null,
      due_date: editDueDate || null,
      ...editRecurrence,
    });
    setEditing(false);
  }

  function handleDelete() {
    if (window.confirm("このタスクを削除しますか?関連する工程もすべて削除されます。")) {
      onDeleteTask(task.id);
    }
  }

  return (
    <>
      <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
        <td className="px-2 py-3 text-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "工程を閉じる" : "工程を開く"}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {expanded ? "▼" : "▶"}
          </button>
        </td>
        <td className="px-4 py-3">
          <select
            value={task.priority}
            onChange={(e) =>
              onPriorityChange(task.id, Number(e.target.value) as Priority)
            }
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400 ${PRIORITY_BADGE_CLASS[task.priority]}`}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-sm font-normal focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
              <RecurrenceFields value={editRecurrence} onChange={setEditRecurrence} />
            </div>
          ) : (
            <>
              {task.title}
              {task.is_recurring && task.recurrence_type && (
                <p className="mt-0.5 text-xs font-normal text-indigo-500">
                  🔁 {formatRecurrenceLabel(task.recurrence_type, task.recurrence_weekday)}
                </p>
              )}
              {total > 0 && (
                <p className="mt-0.5 text-xs font-normal text-zinc-400">
                  工程 {doneCount}/{total}完了
                </p>
              )}
              {task.ai_reason && (
                <p className="mt-0.5 text-xs font-normal text-zinc-400">
                  {task.ai_reason}
                </p>
              )}
            </>
          )}
        </td>
        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
          {editing ? (
            <input
              type="text"
              placeholder="担当者"
              value={editAssignee}
              onChange={(e) => setEditAssignee(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
          ) : (
            task.assignee || "-"
          )}
        </td>
        <td className="px-4 py-3">
          {editing ? (
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="rounded-lg border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
          ) : (
            <span className={overdue ? "font-semibold text-red-600" : "text-zinc-600 dark:text-zinc-400"}>
              {task.due_date || "-"}
              {overdue && " (期限超過)"}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <input
            type="date"
            value={task.suggested_date || ""}
            onChange={(e) => onSuggestedDateChange(task.id, e.target.value)}
            className="rounded-lg border border-zinc-300 bg-transparent px-2 py-1 text-xs text-zinc-600 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-400"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400 ${STATUS_BADGE_CLASS[task.status]}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  削除
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-zinc-100 last:border-0 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40">
          <td colSpan={8} className="px-6 py-4">
            <TaskSubtasks
              taskId={task.id}
              subtasks={subtasks}
              onAdd={onAddSubtask}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
              onMove={onMoveSubtask}
              onBreakdown={onBreakdown}
              breakdownLoading={breakdownLoading}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function TaskSubtasks({
  taskId,
  subtasks,
  onAdd,
  onToggle,
  onDelete,
  onMove,
  onBreakdown,
  breakdownLoading,
}: {
  taskId: number;
  subtasks: Subtask[];
  onAdd: (taskId: number, title: string) => void;
  onToggle: (subtaskId: string, taskId: number, done: boolean) => void;
  onDelete: (subtaskId: string, taskId: number) => void;
  onMove: (taskId: number, subtaskId: string, direction: "up" | "down") => void;
  onBreakdown: (taskId: number) => void;
  breakdownLoading: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const sorted = [...subtasks].sort((a, b) => a.sort_order - b.sort_order);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAdd(taskId, trimmed);
    setNewTitle("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          工程
        </h3>
        <button
          type="button"
          onClick={() => onBreakdown(taskId)}
          disabled={breakdownLoading}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {breakdownLoading ? "AIが分解中..." : "AIで工程を分解する"}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-400">工程はまだありません。</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((subtask, index) => (
            <li
              key={subtask.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <input
                type="checkbox"
                checked={subtask.done}
                onChange={(e) => onToggle(subtask.id, taskId, e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <span
                className={
                  subtask.done
                    ? "flex-1 text-zinc-400 line-through"
                    : "flex-1 text-zinc-700 dark:text-zinc-200"
                }
              >
                {subtask.title}
              </span>
              <button
                type="button"
                onClick={() => onMove(taskId, subtask.id, "up")}
                disabled={index === 0}
                aria-label="上に移動"
                className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => onMove(taskId, subtask.id, "down")}
                disabled={index === sorted.length - 1}
                aria-label="下に移動"
                className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => onDelete(subtask.id, taskId)}
                aria-label="削除"
                className="text-zinc-400 hover:text-red-600"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="工程を追加"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          追加
        </button>
      </form>
    </div>
  );
}
