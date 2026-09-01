"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { NewTaskInput, Task, TaskStatus } from "@/types/task";
import ProgressSummary from "@/components/ProgressSummary";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      setError(error.message);
    } else {
      setTasks(data as Task[]);
      setError(null);
    }
    setLoading(false);
  }

  async function handleAdd(input: NewTaskInput) {
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      title: input.title,
      assignee: input.assignee || null,
      due_date: input.due_date || null,
      priority: input.priority,
      status: "未着手",
    });

    if (error) {
      setError(error.message);
    } else {
      await fetchTasks();
    }
    setSubmitting(false);
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    const previous = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, status } : t)));

    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(previous);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            タスク管理
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            チームのタスク進捗を一目で確認できます
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            エラー: {error}
          </div>
        )}

        <ProgressSummary tasks={tasks} />
        <TaskForm onAdd={handleAdd} submitting={submitting} />

        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            読み込み中...
          </div>
        ) : (
          <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
        )}
      </main>
    </div>
  );
}
