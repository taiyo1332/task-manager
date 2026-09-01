# タスク管理アプリ

Next.js (App Router) + Supabase によるシンプルなタスク管理アプリです。

## セットアップ

1. 依存関係のインストール

   ```bash
   npm install
   ```

2. Supabaseプロジェクトでテーブル・Storageバケットを作成

   `supabase/schema.sql` の内容を Supabase の SQL Editor で実行してください
   (`teams` / `tasks` / `subtasks` / `members` テーブル、`avatars` Storageバケットの
   作成まで含まれます。バケット作成は管理者権限が必要なため anon キーからは実行できず、
   SQL Editor での実行が必須です)。
   ファイル末尾のマイグレーションブロックは、`team_id` が未設定の既存タスクを
   自動作成した「デフォルトチーム」に割り当てます(再実行しても安全です)。

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

## 画面構成

- `/`(チーム選択画面): `teams` テーブルの一覧を表示します。「+ 新しいチームを作成」からチーム名を入力して新規作成でき、作成後はそのチームの画面に遷移します。
- `/team/[teamId]`(チーム全体ビュー): 選択したチームのタスクから `assignee` を自動集計した担当者一覧を丸いアイコンで表示し、各アイコンに件数・完了率のサマリーを表示します。担当者が空欄のタスクは「未割り当て」アイコンにまとまります。上部の「チーム選択に戻る」リンクで `/` に戻れます。「+ 新規タスクを作成」ボタンはタスクが0件でも常に表示され、担当者は既存の一覧からの選択に加えて自由入力もできます(新しい名前を入力すると、そのアイコンが自動で追加されます)。各アイコンをクリックするとアイコン画像アップロード用のモーダルが開きます(名前・進捗テキスト部分をクリックすると個人ビューに遷移します)。
- `/team/[teamId]/person/[name]`(個人ビュー): アイコンをクリックすると遷移する、そのチーム・その人のタスクだけに絞った画面です。一覧表示・新規追加(team_id・assigneeは画面のコンテキストから自動設定)・優先度/ステータス変更・編集・削除・工程(サブタスク)の管理ができます。上部の「チーム全体に戻る」リンクで `/team/[teamId]` に戻れます。「未割り当て」アイコンからは `/team/[teamId]/person/_unassigned` に遷移します。

認証機能はなく、URLを知っていれば誰でも閲覧・編集できます。

## 機能

- チームの作成・選択
- チーム全体ビューからの新規タスク作成(担当者は既存一覧からの選択 or 自由入力、新しい担当者は自動でアイコン化)
- 担当者ごとのタスク一覧表示(優先度順→期限順にソート、選択中のチームで絞り込み)
- 新規タスクの追加(タイトル・期限・優先度を入力、team_id・担当者は画面のコンテキストから自動設定)
- 優先度(高 / 中 / 低)・ステータス(未着手 / 進行中 / 完了)の変更
- タスクの編集(タイトル・担当者・期限・繰り返し設定をその場で修正)・削除(確認ダイアログあり、関連する工程も連動して削除されます)
- 繰り返しタスク
  - 作成・編集フォームの「繰り返し」チェックボックスをONにすると、頻度(毎日/毎週/毎月、毎週の場合は曜日)を設定できます
  - タスクを「完了」にした瞬間、同じ内容(タイトル・担当者・優先度・繰り返し設定)で次回分のタスクを自動生成します(次回期限日は頻度・曜日設定から自動計算)
  - 完了済みタスクは履歴として一覧に残り、新しく生成されたタスクだけが未着手として表示されます
  - 生成されたタスクの `recurrence_parent_id` には元タスクのIDが設定されます
- 進捗サマリー(完了率・ステータス別件数・期限超過件数を一目で確認)
- タスクごとの工程(サブタスク)管理
  - タスクを展開して工程一覧を表示、追加・完了チェック・削除・並び替え(手入力)
  - 「AIで工程を分解する」ボタンでタスク内容からAIが工程を提案(既存の工程は上書きされます)
  - タスク一覧に「工程 n/m完了」の進捗表示
- 担当者アイコンの画像アップロード(チーム全体ビューでアイコンをクリック→モーダルから画像を選択してアップロード、Supabase Storageの `avatars` バケットに保存され `members` テーブルの `avatar_url` に紐づきます。未設定の場合は従来どおり頭文字のアイコンを表示)

## テーブル定義

詳細は `supabase/schema.sql` を参照してください。

`teams` テーブル

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | uuid | チームID |
| name | text | チーム名 |

`tasks` テーブル

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | bigint | 連番のタスクID |
| team_id | uuid | 紐づく `teams.id` |
| title | text | タスク名 |
| status | text | 未着手 / 進行中 / 完了 |
| assignee | text | 担当者 |
| due_date | date | 期限 |
| priority | smallint | 優先度(1=高, 2=中, 3=低) |
| suggested_date | date | 提案日 |
| ai_reason | text | 提案理由 |
| is_recurring | boolean | 繰り返しタスクかどうか |
| recurrence_type | text | 'daily' / 'weekly' / 'monthly' |
| recurrence_weekday | smallint | 毎週の場合の曜日(0=日曜〜6=土曜) |
| recurrence_parent_id | bigint | 繰り返し元タスクの `tasks.id` |

`subtasks` テーブル(タスクの工程、`task_id` は `on delete cascade` のためタスク削除時に自動削除されます)

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | uuid | 工程ID |
| task_id | bigint | 紐づく `tasks.id` |
| title | text | 工程名 |
| done | boolean | 完了フラグ |
| sort_order | integer | 表示順 |

`members` テーブル(担当者のアイコン画像などチーム内の人物情報。`team_id` + `name` の組で一意)

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | uuid | メンバーID |
| team_id | uuid | 紐づく `teams.id` |
| name | text | 担当者名(`tasks.assignee` と一致) |
| avatar_url | text | アイコン画像のURL(Supabase Storage `avatars` バケット) |

## 注意事項

`supabase/schema.sql` のRLSポリシーは開発用に anon キーでの読み書きを許可しています。
本番運用する場合は、認証を導入したうえでポリシーを見直してください。
