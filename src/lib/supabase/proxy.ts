import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthRedirect } from "@/lib/auth/routes";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Proxy から呼び、Supabase のセッション（認証トークン）を検証・更新する。
 * 更新したトークンは、後続の Server Component 用に request へ、ブラウザ用に response へ書き戻す。
 * 未ログインで保護されたページを開いた場合などは、リダイレクトを返す。
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // createServerClient と getClaims() の間に処理を挟まない（セッションが不安定になるため）。
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  const redirectTo = getAuthRedirect(request.nextUrl.pathname, isSignedIn);
  if (!redirectTo) return response;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = redirectTo;
  redirectUrl.search = "";
  const redirectResponse = NextResponse.redirect(redirectUrl);
  // 更新済みのトークンをリダイレクト先にも引き継ぐ。
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}
