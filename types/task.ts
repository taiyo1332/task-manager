export type TaskStatus = "未着手" | "進行中" | "完了";

export type Priority = 1 | 2 | 3;

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string | null;
  due_date: string | null;
  priority: Priority;
  suggested_date: string | null;
  ai_reason: string | null;
  created_at?: string;
}

export interface NewTaskInput {
  title: string;
  assignee: string;
  due_date: string;
  priority: Priority;
}
