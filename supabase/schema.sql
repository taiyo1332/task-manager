-- teams テーブル定義
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;

create policy "Allow anon read" on teams
  for select using (true);

create policy "Allow anon insert" on teams
  for insert with check (true);

-- tasks テーブル定義
-- id は連番の bigint(uuid ではない)
create table if not exists tasks (
  id bigint generated always as identity primary key,
  team_id uuid references teams (id),
  title text not null,
  status text not null default '未着手' check (status in ('未着手', '進行中', '完了')),
  assignee text,
  due_date date,
  priority smallint not null default 2 check (priority in (1, 2, 3)),
  suggested_date date,
  ai_reason text,
  -- 繰り返し設定。recurrence_type は 'daily' | 'weekly' | 'monthly'、
  -- recurrence_weekday は毎週の場合のみ使用(0=日曜 〜 6=土曜)
  is_recurring boolean not null default false,
  recurrence_type text,
  recurrence_weekday smallint,
  recurrence_parent_id bigint references tasks (id),
  created_at timestamptz not null default now()
);

-- 既存環境でカラムがまだ無い場合の追加(冪等)
alter table tasks add column if not exists team_id uuid references teams (id);
alter table tasks add column if not exists is_recurring boolean not null default false;
alter table tasks add column if not exists recurrence_type text;
alter table tasks add column if not exists recurrence_weekday smallint;
alter table tasks add column if not exists recurrence_parent_id bigint references tasks (id);

create index if not exists tasks_team_id_idx on tasks (team_id);

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

create policy "Allow anon delete" on tasks
  for delete using (true);

-- subtasks(工程)テーブル定義
-- task_id は on delete cascade のため、タスク削除時に工程も自動的に削除されます
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

-- members テーブル定義(担当者のアイコン画像などチーム内の人物情報)
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id),
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create unique index if not exists members_team_id_name_key on members (team_id, name);

alter table members enable row level security;

create policy "Allow anon read" on members
  for select using (true);

create policy "Allow anon insert" on members
  for insert with check (true);

create policy "Allow anon update" on members
  for update using (true) with check (true);

-- ============================================================
-- Storage: 担当者アイコン画像用の avatars バケット
-- anon キーではバケットを作成できないため、このブロックは
-- Supabase の SQL Editor(管理者権限)から実行してください。
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Allow anon read avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Allow anon insert avatars" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Allow anon update avatars" on storage.objects
  for update using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

-- ============================================================
-- マイグレーション: team_id が未設定の既存タスクを「デフォルトチーム」に移行
-- (このブロックは既に移行済みの環境で再実行しても安全です)
-- ============================================================

insert into teams (name)
select 'デフォルトチーム'
where not exists (select 1 from teams where name = 'デフォルトチーム');

update tasks
set team_id = (select id from teams where name = 'デフォルトチーム' limit 1)
where team_id is null;
