import { createServerClient } from "@supabase/ssr";
import { io } from "next/cache";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Server Component / Server Action / Route Handler 用の Supabase クライアントを生成する。
 * リクエストごとに新しいクライアントを作ること（グローバルに保持しない）。
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  // supabase-js はセッションの有効期限確認で Date.now() を読む。Cookie 付きのプリレンダー
  // （プリフェッチ）でそれが走ると Cache Components のエラーになるため、プリレンダー中はここで止める。
  // 実際のリクエスト中は io() がすぐに解決するので、Server Action / Route Handler にも影響しない。
  await io();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component からは Cookie を書き込めないため無視する。
          // トークンの更新は Proxy（src/proxy.ts → updateSession）で済ませている。
        }
      },
    },
  });
}
