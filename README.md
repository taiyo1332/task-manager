# タスク管理アプリ

Next.js (App Router) + Supabase によるシンプルなタスク管理アプリです。

## セットアップ

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. Supabaseプロジェクトで `tasks` テーブルを作成

   `supabase/schema.sql` の内容を Supabase の SQL Editor で実行してください。

3. 環境変数の設定

   `.env.local` を編集し、SupabaseプロジェクトのURLとanon keyを設定してください。

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   これらの値は Supabase ダッシュボードの Project Settings > API から取得できます。
   `.env.local` は `.gitignore` により除外されるため、リポジトリにコミットされません。

4. 開発サーバーの起動

   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) を開いて確認してください。

## 機能

- タスク一覧表示(優先度順→期限順にソート)
- 新規タスクの追加(タイトル・担当者・期限・優先度を入力)
- ステータスの変更(未着手 / 進行中 / 完了)
- 進捗サマリー(完了率・ステータス別件数・期限超過件数を一目で確認)

## テーブル定義

`tasks` テーブル(詳細は `supabase/schema.sql`)

| カラム | 型 | 説明 |
| --- | --- | --- |
| title | text | タスク名 |
| status | text | 未着手 / 進行中 / 完了 |
| assignee | text | 担当者 |
| due_date | date | 期限 |
| priority | smallint | 優先度(1=高, 2=中, 3=低) |
| suggested_date | date | AIによる提案日(将来のAI機能用) |
| ai_reason | text | AIによる提案理由(将来のAI機能用) |

## 注意事項

`supabase/schema.sql` のRLSポリシーは開発用に anon キーでの読み書きを許可しています。
本番運用する場合は、認証を導入したうえでポリシーを見直してください。
