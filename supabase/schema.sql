-- tasks テーブル定義
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
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
