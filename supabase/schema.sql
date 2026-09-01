-- tasks テーブル定義
-- id は連番の bigint(uuid ではない)
create table if not exists tasks (
  id bigint generated always as identity primary key,
  title text not null,
  status text not null default '未着手' check (status in ('未着手', '進行中', '完了')),
  assignee text,
  due_date date,
  priority smallint not null default 2 check (priority in (1, 2, 3)),
  suggested_date date,
  ai_reason text,
  created_at timestamptz not null default now()
);

-- 更新日時を自動追跡したい場合は updated_at カラム + トリガーを追加してください

alter table tasks enable row level security;

-- 開発用: anon キーでの読み書きを許可するポリシー。
-- 本番運用時は認証済みユーザーのみに絞るなど、要件に応じて見直してください。
create policy "Allow anon read" on tasks
  for select using (true);

create policy "Allow anon insert" on tasks
  for insert with check (true);

create policy "Allow anon update" on tasks
  for update using (true) with check (true);

-- subtasks(工程)テーブル定義
create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id bigint not null references tasks (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists subtasks_task_id_idx on subtasks (task_id, sort_order);

alter table subtasks enable row level security;

create policy "Allow anon read" on subtasks
  for select using (true);

create policy "Allow anon insert" on subtasks
  for insert with check (true);

create policy "Allow anon update" on subtasks
  for update using (true) with check (true);

create policy "Allow anon delete" on subtasks
  for delete using (true);
