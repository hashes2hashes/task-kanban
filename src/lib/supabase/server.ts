import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Server Component / Server Action / Route Handler 用の Supabase クライアントを生成する。
 * リクエストごとに新しいクライアントを作ること（グローバルに保持しない）。
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
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
          // セッション更新は Proxy 側で行う想定。
        }
      },
    },
  });
}
