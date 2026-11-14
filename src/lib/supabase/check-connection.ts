import { getSupabaseEnv } from "./env";

export type SupabaseConnectionResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Supabase への疎通を確認する。
 * テーブルに依存しないよう Auth のヘルスチェックエンドポイントを API キー付きで叩き、
 * URL とキーの両方が有効かを検証する。
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionResult> {
  let env;
  try {
    env = getSupabaseEnv();
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }

  try {
    const response = await fetch(new URL("/auth/v1/health", env.url), {
      headers: { apikey: env.publishableKey },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return {
        ok: false,
        reason: `HTTP ${response.status} ${response.statusText}`.trim(),
      };
    }
    return { ok: true, url: env.url };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}
