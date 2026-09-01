"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type {
  NewTaskInput,
  Priority,
  RecurrenceInput,
  Subtask,
  Task,
  TaskStatus,
} from "@/types/task";
import { computeNextDueDate } from "@/lib/recurrence";
import ProgressSummary from "@/components/ProgressSummary";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";

export default function TaskWorkspace({
  teamId,
  assignee,
}: {
  teamId: string;
  assignee: string | null;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasksByTask, setSubtasksByTask] = useState<Record<number, Subtask[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [breakdownLoadingId, setBreakdownLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, assignee]);

  async function fetchAll() {
    setLoading(true);
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("team_id", teamId)
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });
    query = assignee === null ? query.is("assignee", null) : query.eq("assignee", assignee);

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const fetchedTasks = data as Task[];
    setTasks(fetchedTasks);
    setError(null);
    setLoading(false);
    await fetchSubtasks(fetchedTasks.map((t) => t.id));
  }

  async function fetchSubtasks(taskIds: number[]) {
    if (taskIds.length === 0) {
      setSubtasksByTask({});
      return;
    }

    const { data, error } = await supabase
      .from("subtasks")
      .select("*")
      .in("task_id", taskIds)
      .order("sort_order", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    const grouped: Record<number, Subtask[]> = {};
    for (const subtask of (data as Subtask[]) ?? []) {
      (grouped[subtask.task_id] ??= []).push(subtask);
    }
    setSubtasksByTask(grouped);
  }

  async function handleAdd(input: NewTaskInput) {
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      team_id: teamId,
      title: input.title,
      assignee,
      due_date: input.due_date || null,
      priority: input.priority,
      status: "未着手",
      is_recurring: input.is_recurring,
      recurrence_type: input.recurrence_type,
      recurrence_weekday: input.recurrence_weekday,
    });

    if (error) {
      setError(error.message);
    } else {
      await fetchAll();
    }
    setSubmitting(false);
  }

  async function handleUpdateTask(
    id: number,
    updates: {
      title: string;
      assignee: string | null;
      due_date: string | null;
    } & RecurrenceInput
  ) {
    const previous = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(previous);
    }
  }

  async function handleDeleteTask(id: number) {
    const previousTasks = tasks;
    const previousSubtasks = subtasksByTask;
    setTasks((cur) => cur.filter((t) => t.id !== id));
    setSubtasksByTask((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(previousTasks);
      setSubtasksByTask(previousSubtasks);
    }
  }

  async function handleStatusChange(id: number, status: TaskStatus) {
    const target = tasks.find((t) => t.id === id);
    const previous = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, status } : t)));

    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(previous);
      return;
    }

    if (status === "完了" && target?.is_recurring && target.recurrence_type) {
      const nextDueDate = computeNextDueDate(
        target.due_date,
        target.recurrence_type,
        target.recurrence_weekday
      );
      const { error: recurError } = await supabase.from("tasks").insert({
        team_id: target.team_id,
        title: target.title,
        assignee: target.assignee,
        due_date: nextDueDate,
        priority: target.priority,
        status: "未着手",
        is_recurring: true,
        recurrence_type: target.recurrence_type,
        recurrence_weekday: target.recurrence_weekday,
        recurrence_parent_id: target.id,
      });

      if (recurError) {
        setError(recurError.message);
      } else {
        await fetchAll();
      }
    }
  }

  async function handlePriorityChange(id: number, priority: Priority) {
    const previous = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, priority } : t)));

    const { error } = await supabase.from("tasks").update({ priority }).eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(previous);
    }
  }

  async function handleSuggestedDateChange(id: number, suggestedDate: string) {
    const previous = tasks;
    const value = suggestedDate || null;
    setTasks((cur) =>
      cur.map((t) => (t.id === id ? { ...t, suggested_date: value } : t))
    );

    const { error } = await supabase
      .from("tasks")
      .update({ suggested_date: value })
      .eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(previous);
    }
  }

  async function handleAddSubtask(taskId: number, title: string) {
    const current = subtasksByTask[taskId] ?? [];
    const nextPosition =
      current.length > 0 ? Math.max(...current.map((s) => s.sort_order)) + 1 : 0;

    const { data, error } = await supabase
      .from("subtasks")
      .insert({ task_id: taskId, title, sort_order: nextPosition })
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setSubtasksByTask((cur) => ({
      ...cur,
      [taskId]: [...(cur[taskId] ?? []), data as Subtask],
    }));
  }

  async function handleToggleSubtask(subtaskId: string, taskId: number, done: boolean) {
    const previous = subtasksByTask;
    setSubtasksByTask((cur) => ({
      ...cur,
      [taskId]: (cur[taskId] ?? []).map((s) => (s.id === subtaskId ? { ...s, done } : s)),
    }));

    const { error } = await supabase.from("subtasks").update({ done }).eq("id", subtaskId);
    if (error) {
      setError(error.message);
      setSubtasksByTask(previous);
    }
  }

  async function handleDeleteSubtask(subtaskId: string, taskId: number) {
    const previous = subtasksByTask;
    setSubtasksByTask((cur) => ({
      ...cur,
      [taskId]: (cur[taskId] ?? []).filter((s) => s.id !== subtaskId),
    }));

    const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
    if (error) {
      setError(error.message);
      setSubtasksByTask(previous);
    }
  }

  async function handleMoveSubtask(
    taskId: number,
    subtaskId: string,
    direction: "up" | "down"
  ) {
    const list = [...(subtasksByTask[taskId] ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const index = list.findIndex((s) => s.id === subtaskId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

    const current = list[index];
    const swapWith = list[swapIndex];
    const previous = subtasksByTask;

    const updated = list.map((s) => {
      if (s.id === current.id) return { ...s, sort_order: swapWith.sort_order };
      if (s.id === swapWith.id) return { ...s, sort_order: current.sort_order };
      return s;
    });
    setSubtasksByTask((cur) => ({ ...cur, [taskId]: updated }));

    const [{ error: error1 }, { error: error2 }] = await Promise.all([
      supabase.from("subtasks").update({ sort_order: swapWith.sort_order }).eq("id", current.id),
      supabase.from("subtasks").update({ sort_order: current.sort_order }).eq("id", swapWith.id),
    ]);

    if (error1 || error2) {
      setError((error1 || error2)!.message);
      setSubtasksByTask(previous);
    }
  }

  async function handleBreakdown(taskId: number) {
    const existing = subtasksByTask[taskId] ?? [];
    if (
      existing.length > 0 &&
      !window.confirm("既存の工程はAIの結果で上書きされます。よろしいですか?")
    ) {
      return;
    }

    setBreakdownLoadingId(taskId);
    setError(null);
    try {
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "AIによる工程分解に失敗しました");
      } else if (data.subtasks) {
        setSubtasksByTask((cur) => ({ ...cur, [taskId]: data.subtasks as Subtask[] }));
      }
    } catch {
      setError("AIによる工程分解に失敗しました");
    } finally {
      setBreakdownLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          エラー: {error}
        </div>
      )}

      <ProgressSummary tasks={tasks} />
      <TaskForm assigneeLabel={assignee ?? "未割り当て"} onAdd={handleAdd} submitting={submitting} />

      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">タスク一覧</h2>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          読み込み中...
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          subtasksByTask={subtasksByTask}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onSuggestedDateChange={handleSuggestedDateChange}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          onMoveSubtask={handleMoveSubtask}
          onBreakdown={handleBreakdown}
          breakdownLoadingId={breakdownLoadingId}
        />
      )}
    </div>
  );
}
