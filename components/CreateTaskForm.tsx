"use client";

import { useState, type FormEvent } from "react";
import type { Priority, RecurrenceInput } from "@/types/task";
import RecurrenceFields from "@/components/RecurrenceFields";

export interface NewTeamTaskInput extends RecurrenceInput {
  title: string;
  assignee: string;
  due_date: string;
  priority: Priority;
}

const DEFAULT_RECURRENCE: RecurrenceInput = {
  is_recurring: false,
  recurrence_type: null,
  recurrence_weekday: null,
};

export default function CreateTaskForm({
  assigneeSuggestions,
  onCreate,
  submitting,
}: {
  assigneeSuggestions: string[];
  onCreate: (input: NewTeamTaskInput) => Promise<void>;
  submitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const [recurrence, setRecurrence] = useState<RecurrenceInput>(DEFAULT_RECURRENCE);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setError(null);
    await onCreate({
      title: title.trim(),
      assignee: assignee.trim(),
      due_date: dueDate,
      priority,
      ...recurrence,
    });
    setTitle("");
    setAssignee("");
    setDueDate("");
    setPriority(2);
    setRecurrence(DEFAULT_RECURRENCE);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        + 新規タスクを作成
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">新規タスク作成</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          閉じる
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto]">
          <input
            type="text"
            placeholder="タスク名"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          <input
            type="text"
            list="team-assignee-suggestions"
            placeholder="担当者(新しい名前も入力可)"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          <datalist id="team-assignee-suggestions">
            {assigneeSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value) as Priority)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value={1}>優先度: 高</option>
            <option value={2}>優先度: 中</option>
            <option value={3}>優先度: 低</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? "作成中..." : "作成"}
          </button>
        </div>
        <RecurrenceFields value={recurrence} onChange={setRecurrence} />
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
