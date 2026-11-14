/**
 * Next.js サーバー起動時に一度だけ呼ばれる。Supabase に接続できない場合のみエラーログを出す。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkSupabaseConnection } = await import(
    "@/lib/supabase/check-connection"
  );
  const result = await checkSupabaseConnection();

  if (!result.ok) {
    console.error(`✗ Supabase に接続できませんでした: ${result.reason}`);
  }
}
