import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 確認メールのリンク先。ログイン状態にしてトップへ戻す。失敗したら /login?error=confirm へ。
 * - `code`: 既定のメールテンプレート（{{ .ConfirmationURL }}）の場合。Supabase がメールアドレスを
 *   確認した後、PKCE の認可コード付きでここに戻すので、セッションに交換する。
 * - `token_hash` + `type`: カスタム SMTP でテンプレートを編集し、ここへ直接リンクする場合。
 */
export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.search = "";

  const error = await confirm(request.nextUrl.searchParams);
  if (error === null) {
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  console.error("メールアドレスの確認に失敗しました:", error);
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("error", "confirm");
  return NextResponse.redirect(redirectUrl);
}

/** リンクのパラメータでログイン状態にする。成功なら null、失敗ならエラー文言を返す。 */
async function confirm(searchParams: URLSearchParams): Promise<string | null> {
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  // EmailOtpType は任意の文字列を許す型なので、値の妥当性は verifyOtp に任せる。
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error?.message ?? null;
  }
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    return error?.message ?? null;
  }
  // Supabase 側で確認に失敗すると、error_description 付きで戻ってくる。
  return searchParams.get("error_description") ?? "確認用のパラメータがありません";
}
