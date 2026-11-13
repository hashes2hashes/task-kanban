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
| フォント | Geist / Geist Mono（`next/font/google`） |
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
│   └── app/               # App Router（ルーティング = ディレクトリ構成）
│       ├── layout.tsx     # ルートレイアウト（フォント・globals.css の読み込み）
│       ├── page.tsx       # トップページ（/）
│       ├── page.test.tsx  # page.tsx のテスト（テストは対象の隣に置く）
│       └── globals.css    # Tailwind の読み込みとテーマトークン
├── public/                # 静的ファイル（/ 直下で配信）
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

## テスト

- Vitest 5 + React Testing Library + jsdom。設定は `vitest.config.mts`（`@/` は `resolve.tsconfigPaths: true` で解決、`vite-tsconfig-paths` プラグインは不要）。
- `vitest.setup.ts` で `@testing-library/jest-dom/vitest` を読み込み済み（`toBeInTheDocument()` 等が使える）。
- テストは `src/**/*.test.{ts,tsx}` に対象ファイルと並べて配置する。
- `async` Server Component は Vitest では未対応。そうした部分は E2E テストで検証する（`docs/01-app/02-guides/testing/`）。

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
