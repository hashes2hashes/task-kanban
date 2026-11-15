# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 最重要: Next.js 16 系の最新 API を前提にする

このプロジェクトは Next.js 16.4 / React 19.3 を使っており、学習データ上の Next.js とは API・規約・ファイル構成が異なる場合がある（`AGENTS.md` 参照）。コードを書く前に、必ず同梱ドキュメント `node_modules/next/dist/docs/`（App Router は `01-app/` 配下）の該当ガイドを読み、非推奨の記述に従うこと。

## 概要

タスク管理カンバン。タスクの追加・編集・削除・一覧表示とステータス管理 (Todo / In Progress / Done) ができる。
Next.ja + Supabase で構築し、Vercel にデプロイする。

## 技術スタック

| 分類 | 採用技術 |
| --- | --- |
| フレームワーク | Next.js 16.4（App Router、Turbopack） |
| UI | React 19.3 |
| 言語 | TypeScript 5.9（strict） |
| スタイリング | Tailwind CSS 4.3（`@tailwindcss/turbopack`） |
| UI コンポーネント | shadcn/ui（CLI 4.23、スタイル `base-nova`、プリミティブは `@base-ui/react`、アイコンは `lucide-react`） |
| フォント | Geist / Geist Mono（`next/font/google`） |
| データベース | Supabase（`@supabase/supabase-js`、`@supabase/ssr`） |
| Lint | ESLint 9（`eslint-config-next`） |
| テスト | Vitest 5、React Testing Library 16、jest-dom、jsdom |
| ランタイム | Node.js 26 系（`@types/node` も 26 に合わせている） |

## コマンド

パッケージマネージャは npm（`package-lock.json`）。

- `npm run dev` — 開発サーバー（http://localhost:3000）
- `npm run build` — 本番ビルド
- `npm run lint` — ESLint（flat config、`eslint-config-next` の core-web-vitals + typescript）
- `npx tsc --noEmit` — 型チェック（専用スクリプトなし）
- `npm test` — Vitest をウォッチモードで実行
- `npm run test:run` — Vitest を1回だけ実行（CI 向け）
- 単一テスト: `npx vitest run src/app/page.test.tsx`、テスト名で絞るなら `npx vitest run -t "見出し"`

## ディレクトリ構成

```
task-kanban/
├── src/
│   ├── app/               # App Router（ルーティング = ディレクトリ構成）
│   │   ├── layout.tsx     # ルートレイアウト（フォント・globals.css の読み込み）
│   │   ├── page.tsx       # トップページ（/）。見出し + <Suspense> 内でカンバンを描画
│   │   ├── page.test.tsx  # page.tsx のテスト（テストは対象の隣に置く）
│   │   ├── actions.ts     # タスクの Server Action（createTask / updateTask / deleteTask）
│   │   ├── _components/   # ページ専用コンポーネント（_ 付きはルーティング対象外）
│   │   │   ├── task-board-loader.tsx  # async Server Component。取得してボードに渡す
│   │   │   ├── kanban-board.tsx       # 3 列のボード（Client）
│   │   │   ├── task-create-form.tsx   # 追加フォーム（Client）
│   │   │   ├── task-card.tsx          # カード表示 ⇄ 編集フォーム、削除（Client）
│   │   │   └── confirm-dialog.tsx     # 削除前の確認ダイアログ（Client）
│   │   └── globals.css    # Tailwind・shadcn の読み込みとテーマトークン
│   ├── components/
│   │   └── ui/            # shadcn/ui のコンポーネント（CLI で追加。例: button.tsx）
│   ├── lib/
│   │   ├── supabase/      # Supabase クライアント・接続確認・生成型（後述）
│   │   ├── tasks/         # タスクの型・入力検証・取得処理（types / validation / queries）
│   │   └── utils.ts       # `cn()`（`cn` パッケージの再エクスポート）
│   └── instrumentation.ts # サーバー起動時フック（Supabase 接続確認）
├── public/                # 静的ファイル（/ 直下で配信）
├── .env.example           # 環境変数のキー一覧（値は .env.local に書く）
├── components.json        # shadcn/ui の設定（スタイル・エイリアス・CSS の場所）
├── next.config.ts         # Next.js 設定（Cache Components、Turbopack ルール）
├── vitest.config.mts      # Vitest 設定
├── vitest.setup.ts        # テスト共通セットアップ（jest-dom）
├── eslint.config.mjs      # ESLint flat config
├── tsconfig.json          # TypeScript 設定（@/* → ./src/*）
└── AGENTS.md              # next dev が自動生成するエージェント向け注意書き
```

`.next/`、`next-env.d.ts`、`*.tsbuildinfo` は生成物で、git 管理外。

## アーキテクチャ・設定の要点

- **App Router のみ**。ソースは `src/app/` 配下。パスエイリアス `@/*` → `./src/*`。
- **Cache Components 有効**（`next.config.ts` の `cacheComponents: true`）。キャッシュ・データ取得は従来モデルではなく Cache Components のモデルで書く（`docs/01-app/01-getting-started/08-caching.md`）。
- **Partial Prefetching 有効**（`partialPrefetching: true`）。`<Link>` はデフォルトでルートの静的部分のみプリフェッチする。`cacheComponents` を外すと設定検証でエラーになる。
- **Tailwind CSS v4 は Turbopack ローダー経由**（`@tailwindcss/turbopack`、`next.config.ts` の `turbopack.rules`）。PostCSS 設定ファイルはない。テーマトークンは `src/app/globals.css` の `@theme inline` で CSS 変数から定義。
- レイアウトの props 型には Next.js が自動生成するグローバル型 `LayoutProps<"/">` を使っている（`src/app/layout.tsx`）。

## shadcn/ui

- **設定**: `components.json`（`style: "base-nova"`、`baseColor: "neutral"`、`cssVariables: true`、`iconLibrary: "lucide"`、`rsc: true`）。Tailwind v4 なので `tailwind.config` は空。初期化は `npx shadcn@latest init -d --no-monorepo` で行った。
- **コンポーネントの追加**: `npx shadcn@latest add <name>`。出力先は `src/components/ui/`（エイリアス `@/components/ui`）。生成コードは自分たちのコードとして扱い、必要なら直接編集してよい。追加前に Context7 で該当コンポーネントの最新ドキュメントを確認する。
- **プリミティブは Base UI**（`@base-ui/react`）。Radix ではないので、Radix 前提の API（`asChild` など）で書かない。Base UI 版の書き方（例: `render` prop）をドキュメントで確認する。
- **`cn()`**: クラス結合は `@/lib/utils` の `cn()` を使う。中身は `cn` パッケージ（shadcn 公式。`clsx` + `tailwind-merge` の後継）の再エクスポート。生成コンポーネントは `cn` パッケージを直接 import している。
- **テーマ**: `src/app/globals.css` が `tw-animate-css` と `shadcn/tailwind.css` を読み込み、`:root` / `.dark` に色の CSS 変数（oklch）、`@theme inline` で `--color-*` に割り当てている。色は `bg-background` / `text-foreground` / `bg-primary` などのトークンで指定し、生の色値を直書きしない。ダークモードは `.dark` クラス方式（`@custom-variant dark`）。
- **フォント変数の注意**: CLI は `--font-sans: var(--font-sans)`（自己参照）を書き出すが、`layout.tsx` が定義するのは `--font-geist-sans`。`@theme inline` では `--font-sans` / `--font-heading` を `var(--font-geist-sans)` にしてある。`init` や `add` で `globals.css` が上書きされたら、ここを確認する。
- **既存コンポーネント**（`src/app/_components/`）は、まだ shadcn/ui に置き換えていない。

## タスク機能の設計（データの流れ）

- **一覧取得**: `page.tsx` → `<Suspense>` → `TaskBoardLoader`（async Server Component）→ `getTasks()`（`src/lib/tasks/queries.ts`）。
  サーバーの Supabase クライアントは `cookies()` を使うので、`<Suspense>` の外で取得すると Cache Components のビルドで blocking-route エラーになる。データは `use cache` していない（毎リクエスト取得）。
- **try/catch で `cookies()` を囲まない**: プリレンダー中、Next.js は `cookies()` の Promise を reject してレンダーを止める。これを catch すると build 時に `HANGING_PROMISE_REJECTION` が出る。そのため `getTasks()` は例外を投げず、`{ ok: true, tasks } | { ok: false, reason }` を返す。DB エラーも同様に、例外ではなく結果の値で扱う。
- **変更（追加・編集・削除）**: `src/app/actions.ts` の Server Action。シグネチャは `useActionState` 形式の `(prevState: ActionState, formData: FormData) => Promise<ActionState>`、`ActionState = { error: string | null }`。検証 → Supabase → 成功時に `next/cache` の `refresh()`。これで一覧がすぐ更新される。失敗時は例外を投げず、日本語のエラー文言を返す。
- **Server Action は props で渡す**: `TaskBoardLoader` が `createTask` などを `KanbanBoard` に props（型 `TaskAction`、`task-card.tsx`）で渡す。Client Component は `@/app/actions` を直接 import しない。テストで `vi.fn()` を注入するため。
- **入力検証は `parseTaskForm()`（`src/lib/tasks/validation.ts`）に一本化**。Client 側（即時のエラー表示）と Server Action 側の両方で同じ関数を使う。上限値は `src/lib/tasks/types.ts` の `titleMaxLength`（100）/ `descriptionMaxLength`（1000）。文字数はコードポイント単位で数える（DB の `char_length` と同じ）。
- **フォームは controlled（`useState`）で値を保持**。React 19 の `<form action>` は送信後に uncontrolled な入力をリセットする。controlled にしておけば、エラー時も入力が残り、成功時だけ自分で空にできる。
- **ステータス**: `taskStatuses` / `taskStatusLabels` / `isTaskStatus()`（`types.ts`）を使う。文字列を `as TaskStatus` でキャストせず、型ガードで絞る。DB の `status` は `text` なので、`getTasks()` が定義外の値の行を除外する。
- **削除**: `ConfirmDialog`（`role="alertdialog"`、初期フォーカスはキャンセル、Esc でキャンセル）で確認してから `deleteTask` を実行する。

## Supabase

- **プロジェクト**: `task-kanban`（ref: `sdtdbhubjlwxdmixgaeh`、ap-southeast-2、Postgres 17）。Supabase MCP のツールではこの ref を `project_id` に指定する。
- **環境変数**: `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`（`sb_publishable_...` 形式。旧 `ANON_KEY` は使わない）。キーは `.env.example` に、実際の値は `.env.local`（git 管理外）に書く。`.gitignore` は `.env*` を除外し、`!.env.example` だけを例外にしている。
- **環境変数の読み込み**: 必ず `src/lib/supabase/env.ts` の `getSupabaseEnv()` を通す。未設定のときは、足りない変数名を含むエラーを投げる。`process.env.X!` の非 null アサーションは使わない。
- **クライアントの使い分け**（どちらも `createClient()` という名前）:
  - Server Component / Server Action / Route Handler では `@/lib/supabase/server`。`async` なので `await createClient()` で呼ぶ。`await cookies()` を使うので、リクエストごとに生成し、モジュールのグローバル変数に保持しない。
  - Client Component では `@/lib/supabase/client`。
  - Server Component からは Cookie を書けないため、`setAll` の例外は握りつぶしている。認証を導入してセッションを更新する必要が出たら、Proxy（`proxy.ts`）で `updateSession` を実装する。
- **起動時の接続確認**: `src/instrumentation.ts` の `register()`（Node.js ランタイムのみ）が `checkSupabaseConnection()` を呼ぶ。この関数は、テーブルに依存しない `/auth/v1/health` に API キーを付けて叩き、URL とキーの両方を検証する（タイムアウト 5 秒）。**失敗時のみ** `console.error` でログを出し、成功時は何も出さない。
- **接続確認の結果型**: `checkSupabaseConnection()` は例外を投げず、`{ ok: true, url } | { ok: false, reason }` を返す。
- **テスト**: 環境変数は `vi.stubEnv`、通信は `vi.stubGlobal("fetch", ...)` でモックする。後片付けは `afterEach` で `vi.unstubAllEnvs()` / `vi.unstubAllGlobals()`（例: `src/lib/supabase/check-connection.test.ts`）。
- **スキーマ変更**: Supabase MCP の `apply_migration` で行う。変更の前に `list_tables` で現状を確認する。適用後は `get_advisors`（security）で警告がないか確認する。
- **型**: `generate_typescript_types` の出力を `src/lib/supabase/database.types.ts` にそのまま保存する（手で編集しない）。`server.ts` / `client.ts` は `<Database>` ジェネリクス付きで生成する。スキーマを変えたら型も生成し直す。行の型は `Tables<"tasks">` を使う。
- **テーブル `public.tasks`**（適用済みマイグレーション: `create_tasks_table`、`grant_tasks_to_api_roles`）:

  | 列 | 型・制約 |
  | --- | --- |
  | `id` | `uuid` PK、`gen_random_uuid()` |
  | `title` | `text not null`、前後空白を除いて 1〜100 文字（check） |
  | `description` | `text not null default ''`、1000 文字以内（check） |
  | `status` | `text not null default 'todo'`、`'todo' \| 'in_progress' \| 'done'`（check。enum 型ではない） |
  | `created_at` / `updated_at` | `timestamptz`。`updated_at` は trigger `tasks_set_updated_at`（関数 `public.set_updated_at()`）で自動更新 |

  制約を変えるときは、DB の check と `validation.ts` / `types.ts` の両方を揃える。
- **テーブル作成時は GRANT も必要**: このプロジェクトでは、新しいテーブルに API ロールの権限が自動で付かない。RLS ポリシーだけだと `permission denied for table ...` になるので、`grant select, insert, update, delete on table ... to anon, authenticated;` を必ず一緒に書く。
- **RLS（暫定）**: 認証が未導入のため、`tasks` のポリシーは `anon` / `authenticated` に全操作を許可している（publishable キーがあれば誰でも読み書きできる）。認証を導入したら `user_id` 列を追加し、`auth.uid()` でポリシーを絞る。
- **関数を作るとき**は `set search_path = ''` を付ける（advisor の警告を防ぐ）。

## テスト

- Vitest 5 + React Testing Library + jsdom。設定は `vitest.config.mts`（`@/` は `resolve.tsconfigPaths: true` で解決、`vite-tsconfig-paths` プラグインは不要）。
- `vitest.setup.ts` で `@testing-library/jest-dom/vitest` を読み込み済み（`toBeInTheDocument()` 等が使える）。
- テストは `src/**/*.test.{ts,tsx}` に対象ファイルと並べて配置する。
- `async` Server Component は Vitest では未対応。そうした部分は E2E テストで検証する（`docs/01-app/02-guides/testing/`）。`page.test.tsx` では `vi.mock("./_components/task-board-loader")` で差し替えて、見出しだけを検証している。
- 操作は `@testing-library/user-event`（`userEvent.setup()`）で書く。要素はロールとアクセシブルネームで取る（例: `getByRole("region", { name: "Todo" })`、`getByRole("button", { name: "「買い物」を編集" })`）。
- **Server Action・取得処理のテスト**（`src/app/actions.test.ts`、`src/lib/tasks/queries.test.ts`）: `vi.hoisted` + `vi.mock` で `@/lib/supabase/server` の `createClient` と `next/cache` の `refresh` をモックする。Supabase は、呼び出しを記録して `then` で結果を返すフェイクのクエリビルダーで代用する。エラー時のログは `vi.spyOn(console, "error")` で抑える。
- **コンポーネントのテスト**: Server Action は props で注入した `vi.fn<TaskAction>()` で代用し、送信内容は `mock.calls[0][1]`（FormData）で検証する。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行なってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないでください
- 状態遷移: 画面遷移の順方向・逆方向を検証してください
- モック方針: 外部依存のみモック貸してください

## 禁止事項
- console.log を本番コードに残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新仕様はContext7 MCPを使って公式ドキュメントを確認してください
