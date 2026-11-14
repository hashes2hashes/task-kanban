export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};

/**
 * Supabase の接続に必要な環境変数を取得する。未設定の場合はエラーを投げる。
 * NEXT_PUBLIC_ 変数はビルド時にインライン化されるため、process.env.XXX の形で直接参照する。
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);

  if (!url || !publishableKey) {
    throw new Error(`Supabase の環境変数が未設定です: ${missing.join(", ")}`);
  }

  return { url, publishableKey };
}
