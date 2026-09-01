# タスク管理アプリ

Next.js (App Router) + Supabase によるシンプルなタスク管理アプリです。

## セットアップ

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. Supabaseプロジェクトで `tasks` / `subtasks` テーブルを作成

   `supabase/schema.sql` の内容を Supabase の SQL Editor で実行してください。

3. 環境変数の設定

   `.env.local` を編集し、SupabaseプロジェクトのURL・anon key・Anthropic APIキーを設定してください。

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

   Supabaseの値は Supabase ダッシュボードの Project Settings > API から取得できます。
   `ANTHROPIC_API_KEY` は工程の自動分解機能(`/api/breakdown`)で使用します。
   `.env.local` は `.gitignore` により除外されるため、リポジトリにコミットされません。

4. 開発サーバーの起動

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) を開いて確認してください。

## 機能

- タスク一覧表示(優先度順→期限順にソート)
- 新規タスクの追加(タイトル・担当者・期限・優先度を入力)
- 優先度(高 / 中 / 低)・ステータス(未着手 / 進行中 / 完了)の変更
- 進捗サマリー(完了率・ステータス別件数・期限超過件数を一目で確認)
- タスクごとの工程(サブタスク)管理
  - タスクを展開して工程一覧を表示、追加・完了チェック・削除・並び替え(手入力)
  - 「AIで工程を分解する」ボタンでタスク内容からAIが工程を提案(既存の工程は上書きされます)
  - タスク一覧に「工程 n/m完了」の進捗表示

## テーブル定義

詳細は `supabase/schema.sql` を参照してください。

`tasks` テーブル

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | bigint | 連番のタスクID |
| title | text | タスク名 |
| status | text | 未着手 / 進行中 / 完了 |
| assignee | text | 担当者 |
| due_date | date | 期限 |
| priority | smallint | 優先度(1=高, 2=中, 3=低) |
| suggested_date | date | 提案日 |
| ai_reason | text | 提案理由 |

`subtasks` テーブル(タスクの工程)

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | uuid | 工程ID |
| task_id | bigint | 紐づく `tasks.id` |
| title | text | 工程名 |
| done | boolean | 完了フラグ |
| sort_order | integer | 表示順 |

## 注意事項

`supabase/schema.sql` のRLSポリシーは開発用に anon キーでの読み書きを許可しています。
本番運用する場合は、認証を導入したうえでポリシーを見直してください。
