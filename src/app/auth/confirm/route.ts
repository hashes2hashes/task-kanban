import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ConfirmResult = { ok: true; isRecovery: boolean } | { ok: false; error: string };

/**
 * 確認メール・パスワード再設定メールのリンク先。ログイン状態にしてから戻す。
 * - 確認メール → トップ（/）
 * - 再設定メール → 新しいパスワードの入力画面（/reset-password）
 * - 失敗 → /login?error=confirm
 *
 * - `code`: 既定のメールテンプレート（{{ .ConfirmationURL }}）の場合。Supabase がリンクを
 *   確認した後、PKCE の認可コード付きでここに戻すので、セッションに交換する。
 * - `token_hash` + `type`: カスタム SMTP でテンプレートを編集し、ここへ直接リンクする場合。
 */
export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.search = "";

  const result = await confirm(request.nextUrl.searchParams);
  if (result.ok) {
    redirectUrl.pathname = result.isRecovery ? "/reset-password" : "/";
    return NextResponse.redirect(redirectUrl);
  }

  console.error("メールのリンクの確認に失敗しました:", result.error);
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("error", "confirm");
  return NextResponse.redirect(redirectUrl);
}

/** リンクのパラメータでログイン状態にし、再設定用のリンクだったかどうかを返す。 */
async function confirm(searchParams: URLSearchParams): Promise<ConfirmResult> {
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  // EmailOtpType は任意の文字列を許す型なので、値の妥当性は verifyOtp に任せる。
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    // 再設定用のリンク（resetPasswordForEmail で始めたフロー）なら、交換時に
    // PASSWORD_RECOVERY イベントが通知される。交換の前に購読しておく。
    let isRecovery = false;
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") isRecovery = true;
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    listener.subscription.unsubscribe();
    if (error) return { ok: false, error: error.message };
    return { ok: true, isRecovery };
  }
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return { ok: false, error: error.message };
    return { ok: true, isRecovery: type === "recovery" };
  }
  // Supabase 側で確認に失敗すると、error_description 付きで戻ってくる。
  return {
    ok: false,
    error: searchParams.get("error_description") ?? "確認用のパラメータがありません",
  };
}
