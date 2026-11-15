# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 最重要: Next.js 16 系の最新 API を前提にする

このプロジェクトは Next.js 16.4 / React 19.3 を使っており、学習データ上の Next.js とは API・規約・ファイル構成が異なる場合がある（`AGENTS.md` 参照）。コードを書く前に、必ず同梱ドキュメント `node_modules/next/dist/docs/`（App Router は `01-app/` 配下）の該当ガイドを読み、非推奨の記述に従うこと。

## 概要

タスク管理カンバン。タスクの追加・編集・削除・一覧表示とステータス管理 (Todo / In Progress / Done) ができる。
Next.js + Supabase で構築し、Vercel にデプロイする。

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
│   │   ├── page.tsx       # トップページ（/）。ヘッダー（<Suspense> 内に UserMenu）+ <Suspense> 内でカンバンを描画
│   │   ├── page.test.tsx  # page.tsx のテスト（テストは対象の隣に置く）
│   │   ├── actions.ts     # タスクの Server Action（createTask / updateTask / deleteTask）
│   │   ├── _components/   # ページ専用コンポーネント（_ 付きはルーティング対象外）
│   │   │   ├── task-board-loader.tsx  # async Server Component。取得してボードに渡す
│   │   │   ├── user-menu.tsx          # async Server Component。メールアドレスとログアウト
│   │   │   ├── kanban-board.tsx       # 3 列のボード（Client）
│   │   │   ├── task-create-form.tsx   # 追加フォーム（Client）
│   │   │   ├── task-card.tsx          # カード表示 ⇄ 編集フォーム、削除（Client）
│   │   │   └── confirm-dialog.tsx     # 削除前の確認ダイアログ（Client）
│   │   ├── login/page.tsx  # ログイン画面（/login）
│   │   ├── signup/page.tsx # 新規登録画面（/signup）
│   │   ├── forgot-password/page.tsx  # パスワード再設定の申請画面（/forgot-password）
│   │   ├── reset-password/page.tsx   # 新しいパスワードの入力画面（/reset-password、要ログイン）
│   │   ├── auth/
│   │   │   ├── actions.ts             # 認証の Server Action（signIn / signUp / signOut / requestPasswordReset / updatePassword）
│   │   │   ├── confirm/route.ts       # 確認メール・再設定メールのリンク先（/auth/confirm）。code をセッションに交換（token_hash なら verifyOtp）
│   │   │   └── _components/           # AuthCard（画面の枠）・CredentialsForm / ForgotPasswordForm / ResetPasswordForm（Client）
│   │   └── globals.css    # Tailwind・shadcn の読み込みとテーマトークン
│   ├── components/
│   │   └── ui/            # shadcn/ui のコンポーネント（CLI で追加。例: button.tsx）
│   ├── lib/
│   │   ├── auth/          # リダイレクト判定・認証フォームの検証・ログインユーザー取得（routes / validation / session）
│   │   ├── supabase/      # Supabase クライアント・Proxy 用セッション更新・接続確認・生成型（後述）
│   │   ├── tasks/         # タスクの型・入力検証・取得処理（types / validation / queries）
│   │   └── utils.ts       # `cn()`（`cn` パッケージの再エクスポート）
│   ├── proxy.ts           # Proxy（旧 Middleware）。全リクエストでセッション更新と認証リダイレクト
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
- **画面の構成**: `src/app/_components/` は shadcn/ui で組んでいる（`button` / `card` / `input` / `textarea` / `label` / `badge` / `alert` / `alert-dialog` / `native-select` / `skeleton`）。エラー表示は `Alert variant="destructive"`（`role="alert"`）、アイコンは `lucide-react`。
- **ステータス選択は `native-select`**: Base UI の `Select` はネイティブの `<select>` ではないため、テストの `combobox` + `user.selectOptions` が使えない。
- **`ConfirmDialog` は `AlertDialog`（Base UI）**: マウント中だけ `open`、Esc / キャンセルは `onOpenChange(false)` → `onCancel`。初期フォーカスは Popup の `initialFocus` で指定する。Base UI は次のフレームでフォーカスを移すため、テストでは `waitFor` で待つ。

## デザインルール

UI は shadcn/ui（base-nova）のトーンに揃える。新しい画面・部品を作るときも以下に従う。

- **部品は shadcn/ui から選ぶ**: 生の `<button>` / `<input>` / `<textarea>` / `<select>` は書かず、`@/components/ui` の部品を使う。足りない部品は `npx shadcn@latest add` で追加し、自前で似た部品を作らない。
- **色はトークンだけ**: `bg-background` / `bg-card` / `bg-muted` / `text-foreground` / `text-muted-foreground` / `border` / `text-destructive` などを使う。`zinc-*` / `red-*` などのパレット色や生の色値は書かない。ダーク用の `dark:` クラスも原則書かない（トークンが `.dark` で切り替わる）。
- **面の階層**: ページ背景 `bg-background` → 列などのまとまり `rounded-xl border bg-muted/40 p-3` → 個々の要素 `Card`（タスクは `size="sm"`、hover で `shadow-md`）。角丸は `rounded-xl`（面）/ `rounded-lg`（小要素）に揃える。
- **ボタンの使い分け**: 主操作（追加・保存）は `default`、取り消しは `ghost`（ダイアログ内は `AlertDialogCancel` の `outline`）、破壊的操作は `destructive`。カード上の操作は `variant="ghost" size="icon-sm"` のアイコンボタンにし、`aria-label` に対象名を入れる（例: `「買い物」を削除`）。
- **アイコン**: `lucide-react` の `〜Icon` 名で import し、装飾なので `aria-hidden="true"` を付ける。ステータスは Todo `CircleIcon` / In Progress `CircleDashedIcon` / Done `CircleCheckIcon`。
- **フォーム**: `Label htmlFor` と `useId()` で入力と紐付け、ラベルの文言をアクセシブルネームにする。項目は `flex flex-col gap-1.5〜2` で縦に並べる。
- **状態の見せ方**:
  - 送信中: ボタンを `disabled` にし、`Loader2Icon className="animate-spin"` と「追加中…」などの文言を出す。
  - エラー: `Alert variant="destructive"` + `AlertCircleIcon`（`role="alert"` が付く）。
  - 空: 点線枠（`border border-dashed`）+ アイコン + 短い文言。
  - 読み込み: `Skeleton` で実際のレイアウトに近い形を出し、`sr-only` で「読み込み中…」を入れる。
  - 確認: 破壊的操作は `AlertDialog`（`ConfirmDialog`）で確認する。
- **見出しの階層**: ページ `h1` → 列 `h2` → カード `h3`。テストが見出しのレベルで要素を取るので崩さない（`CardTitle` は `div` なので、見出しが必要なら `h3` を明示する）。
- **レスポンシブ**: モバイル基準で書き、`sm:`（フォームを横並び）/ `md:`（3 列）で広げる。390px 幅で横スクロールが出ないこと。
- **ホバー前提にしない**: 操作ボタンを hover 時だけ表示する作りにしない（タッチ端末で押せなくなる）。常時表示し、色を `text-muted-foreground` にして控えめにする。
- **デザインの確認**: UI を変えたら Playwright MCP で、デスクトップ（1280px）・モバイル（390px）・ダーク（`<html>` に `dark` クラスを付ける）のスクリーンショットを撮って確認する。

## 認証（Supabase Auth、メール+パスワード）

- **全体の流れ**: `src/proxy.ts` → `updateSession()`（`src/lib/supabase/proxy.ts`）が全リクエストで `auth.getClaims()` を呼び、トークンを検証・更新して Cookie に書き戻す。続けて `getAuthRedirect()`（`src/lib/auth/routes.ts`）で、未ログインなら `/login` へ、ログイン済みで `/login`・`/signup`・`/forgot-password` を開いたら `/` へリダイレクトする。公開パスは `/login`・`/signup`・`/forgot-password`・`/auth/*`。`/reset-password` は再設定リンクでログインした状態で開くので公開しない。
- **`updateSession` の注意**: `createServerClient` と `getClaims()` の間に処理を挟まない（Supabase 公式の注意。セッションが不安定になる）。リダイレクトを返すときは、更新済みの Cookie をリダイレクトのレスポンスにも移す。
- **ログインユーザーの取得は `getSignedInUser(supabase)`**（`src/lib/auth/session.ts`）。`getClaims()`（署名を検証する）を使い、`getSession()` の user は信用しない。戻り値は `{ id, email } | null`。
- **Proxy だけに頼らない**: Server Action は Proxy の matcher の影響を受けるので、`createTask` などは先頭で `getSignedInUser` を確認し、未ログインなら「ログインが必要です…」を返す。最終防御は RLS。
- **認証の Server Action**（`src/app/auth/actions.ts`）: `signIn` / `signUp` は `(prev: AuthActionState, formData) => Promise<AuthActionState>`、`AuthActionState = { error, message }`。成功時は `redirect()`（例外で中断するので try/catch で囲まない）。`signUp` はメール確認待ち（`session` が null）なら `message` を返す。`emailRedirectTo` にはリクエストの `Origin` + `/auth/confirm` を渡す。`signOut` は `/login` へリダイレクト。戻り先 URL は `getConfirmUrl()`（Origin がなければ null で、Supabase の Site URL に任せる）。
- **入力検証**（`src/lib/auth/validation.ts`）は Client のフォームと Server Action の両方で同じ関数を使う。ログイン・新規登録は `parseCredentialsForm()`、再設定の申請は `parseEmailForm()`、新しいパスワードは `parseNewPasswordForm()`（`password` と `passwordConfirmation` の一致も確認）。パスワードは `passwordMinLength`（6、Supabase の既定）以上で、trim しない。
- **ログイン失敗の文言**は、メールとパスワードのどちらが誤りかを明かさない。`email_not_confirmed` だけ確認を促す文言にする。
- **確認メール**: 戻り先は `/auth/confirm`（Route Handler）。成功で `/`、失敗で `/login?error=confirm`（ログイン画面に案内を表示）。
  - 既定のテンプレート（`{{ .ConfirmationURL }}`）では、Supabase がメールアドレスを確認してから `?code=...` 付きで戻すので、`exchangeCodeForSession(code)` でセッションに交換する（`@supabase/ssr` は PKCE フロー）。
  - PKCE の code verifier は登録したブラウザの Cookie にあるため、別の端末でリンクを開くと交換に失敗する。ただしメールアドレスの確認自体は済んでいるので、ログインすればよい（案内の文言もそうしている）。
  - `token_hash` + `type` が来た場合は `verifyOtp` で確認する（カスタム SMTP でテンプレートを編集したとき用）。
- **パスワード再設定**: `/login` の「パスワードをお忘れの方」→ `/forgot-password` で `requestPasswordReset`（`resetPasswordForEmail`、`redirectTo` は確認メールと同じ `/auth/confirm`）→ メールのリンク → `/auth/confirm` でセッションに交換して `/reset-password` へ → `updatePassword`（`updateUser({ password })`）→ `/`。
  - `/auth/confirm` は、交換時に通知される `PASSWORD_RECOVERY` イベント（`onAuthStateChange`。交換の前に購読する）で再設定用のリンクかを判別する。`exchangeCodeForSession` の戻り値の `redirectType` は実行時には返るが型定義にないので使わない。`verifyOtp` の場合は `type === "recovery"` で判別する。
  - 戻り先が確認メールと同じなので、Redirect URLs の追加登録は不要。
  - 申請の結果は、メールアドレスが登録済みかどうかを明かさない文言にする（Supabase も未登録のアドレスでエラーを返さない）。送信回数の上限（`over_email_send_rate_limit`）だけ別の文言にする。
  - `updatePassword` も先頭で `getSignedInUser` を確認する。`same_password` と `weak_password` は別の文言にする。
  - `/reset-password` はログイン中なら誰でも開けるので、実質的に「パスワード変更」画面も兼ねる（現在のパスワードは求めない）。
- **Supabase ダッシュボードの設定**（MCP では変更できない）:
  - Authentication → URL Configuration:
    - Site URL は本番 URL にする。`emailRedirectTo` が Redirect URLs に合わないと、Supabase は Site URL に戻すため、localhost のままだと本番の確認メールから localhost に飛ばされる。
    - Redirect URLs には `http://localhost:3000/**`（開発用）と本番の `https://<ドメイン>/auth/confirm` を登録する。本番は完全一致の URL で登録する。
    - Vercel のプレビューデプロイは URL が毎回変わるため、そのままでは確認メールの戻り先が許可されない。プレビューでも登録を試す場合は `https://*-<チーム名>.vercel.app/**` を追加する。
  - メールテンプレートは既定のまま使う。組み込み SMTP ではテンプレートを編集できない（編集にはカスタム SMTP の設定が必要）。
  - 無料プランの組み込み SMTP は送信数の上限が小さい（1 時間に数通）。
- **画面**: `/login`・`/signup`・`/forgot-password`・`/reset-password` は `AuthCard`（中央寄せのカード）+ 各フォーム（Server Action は props で受け取る）。トップのヘッダー右に `UserMenu`（`<Suspense>` 内）。

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
  - Server Component からは Cookie を書けないため、`setAll` の例外は握りつぶしている。トークンの更新は Proxy（`src/proxy.ts` → `updateSession`）で済ませている。
  - `createClient()` は `cookies()` の後に `await io()`（`next/cache`）を呼ぶ。supabase-js はセッションの有効期限確認で `Date.now()` を読むため、Cookie 付きのプリレンダー（プリフェッチ）中に走ると `blocking-prerender-current-time` エラーになる（ログイン中だけ発生）。消さないこと。
- **起動時の接続確認**: `src/instrumentation.ts` の `register()`（Node.js ランタイムのみ）が `checkSupabaseConnection()` を呼ぶ。この関数は、テーブルに依存しない `/auth/v1/health` に API キーを付けて叩き、URL とキーの両方を検証する（タイムアウト 5 秒）。**失敗時のみ** `console.error` でログを出し、成功時は何も出さない。
- **接続確認の結果型**: `checkSupabaseConnection()` は例外を投げず、`{ ok: true, url } | { ok: false, reason }` を返す。
- **テスト**: 環境変数は `vi.stubEnv`、通信は `vi.stubGlobal("fetch", ...)` でモックする。後片付けは `afterEach` で `vi.unstubAllEnvs()` / `vi.unstubAllGlobals()`（例: `src/lib/supabase/check-connection.test.ts`）。
- **スキーマ変更**: Supabase MCP の `apply_migration` で行う。変更の前に `list_tables` で現状を確認する。適用後は `get_advisors`（security）で警告がないか確認する。
- **型**: `generate_typescript_types` の出力を `src/lib/supabase/database.types.ts` にそのまま保存する（手で編集しない）。`server.ts` / `client.ts` は `<Database>` ジェネリクス付きで生成する。スキーマを変えたら型も生成し直す。行の型は `Tables<"tasks">` を使う。
- **テーブル `public.tasks`**（適用済みマイグレーション: `create_tasks_table`、`grant_tasks_to_api_roles`、`restrict_tasks_to_owner`）:

  | 列 | 型・制約 |
  | --- | --- |
  | `id` | `uuid` PK、`gen_random_uuid()` |
  | `title` | `text not null`、前後空白を除いて 1〜100 文字（check） |
  | `description` | `text not null default ''`、1000 文字以内（check） |
  | `status` | `text not null default 'todo'`、`'todo' \| 'in_progress' \| 'done'`（check。enum 型ではない） |
  | `created_at` / `updated_at` | `timestamptz`。`updated_at` は trigger `tasks_set_updated_at`（関数 `public.set_updated_at()`）で自動更新 |
  | `user_id` | `uuid not null default auth.uid()`、`auth.users(id)` を参照（`on delete cascade`）。インデックス `tasks_user_id_idx` |

  制約を変えるときは、DB の check と `validation.ts` / `types.ts` の両方を揃える。
- **テーブル作成時は GRANT も必要**: このプロジェクトでは、新しいテーブルに API ロールの権限が自動で付かない。RLS ポリシーだけだと `permission denied for table ...` になるので、`grant select, insert, update, delete on table ... to authenticated;` を必ず一緒に書く（ログイン必須のデータなら `anon` には付けない）。
- **RLS（本人のみ）**: `tasks` のポリシーは `authenticated` 向けの `tasks_select_own` / `tasks_insert_own` / `tasks_update_own` / `tasks_delete_own` で、すべて `(select auth.uid()) = user_id`（insert・update は `with check` も同条件）。`anon` には `tasks` の権限自体がない（`revoke all`）。
  - `user_id` は DB の既定値 `auth.uid()` で埋まるので、アプリは `insert` で `user_id` を渡さない。他人の `user_id` を指定しても `with check` で拒否される。
  - `getTasks()` は `user_id` で絞り込まない（RLS が本人の行だけを返す）。
  - ポリシーでは `auth.uid()` を `(select auth.uid())` で包む（行ごとの再評価を防ぐ。advisor 推奨）。
- **関数を作るとき**は `set search_path = ''` を付ける（advisor の警告を防ぐ）。

## テスト

- Vitest 5 + React Testing Library + jsdom。設定は `vitest.config.mts`（`@/` は `resolve.tsconfigPaths: true` で解決、`vite-tsconfig-paths` プラグインは不要）。
- `vitest.setup.ts` で `@testing-library/jest-dom/vitest` を読み込み済み（`toBeInTheDocument()` 等が使える）。
- テストは `src/**/*.test.{ts,tsx}` に対象ファイルと並べて配置する。
- `async` Server Component は Vitest では未対応。そうした部分は E2E テストで検証する（`docs/01-app/02-guides/testing/`）。`page.test.tsx` では `vi.mock("./_components/task-board-loader")` と `vi.mock("./_components/user-menu")` で差し替えて、見出しだけを検証している。
- 操作は `@testing-library/user-event`（`userEvent.setup()`）で書く。要素はロールとアクセシブルネームで取る（例: `getByRole("region", { name: "Todo" })`、`getByRole("button", { name: "「買い物」を編集" })`）。
- **Server Action・取得処理のテスト**（`src/app/actions.test.ts`、`src/lib/tasks/queries.test.ts`）: `vi.hoisted` + `vi.mock` で `@/lib/supabase/server` の `createClient` と `next/cache` の `refresh` をモックする。Supabase は、呼び出しを記録して `then` で結果を返すフェイクのクエリビルダーで代用する。エラー時のログは `vi.spyOn(console, "error")` で抑える。フェイクには `auth.getClaims` も持たせ、`createFakeSupabase(result, { signedIn: false })` で未ログインを再現する。
- **認証のテスト**（`src/app/auth/actions.test.ts`）: `createClient` に加えて `next/navigation` の `redirect` と `next/headers` の `headers` をモックする。`redirect` はモックでは中断しないので、呼ばれた引数で検証する。`/auth/confirm` のテスト（`route.test.ts`）では、フェイクの `exchangeCodeForSession` が購読済みのリスナーに `PASSWORD_RECOVERY` を通知して、再設定用のリンクを再現する。
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
