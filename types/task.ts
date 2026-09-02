export type TaskStatus = "未着手" | "進行中" | "完了";

export type Priority = 1 | 2 | 3;

export type RecurrenceType = "daily" | "weekly" | "monthly";

export interface Task {
  id: number;
  team_id: string;
  title: string;
  status: TaskStatus;
  assignee: string | null;
  due_date: string | null;
  priority: Priority;
  suggested_date: string | null;
  ai_reason: string | null;
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_weekday: number | null;
  recurrence_parent_id: number | null;
  created_at?: string;
}

export interface RecurrenceInput {
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_weekday: number | null;
}

export interface NewTaskInput extends RecurrenceInput {
  title: string;
  due_date: string;
  priority: Priority;
}

export interface Subtask {
  id: string;
  task_id: number;
  title: string;
  done: boolean;
  sort_order: number;
  due_date: string | null;
  created_at?: string;
}
