"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parseCredentialsForm } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null; message: string | null };

export type AuthAction = (
  prevState: AuthActionState,
  formData: FormData,
) => Promise<AuthActionState>;

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseCredentialsForm(formData);
  if (!parsed.ok) return { error: parsed.error, message: null };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // 未確認のメールアドレスだけは、対処が分かるように別の文言にする。
    if (error.code === "email_not_confirmed") {
      return {
        error: "メールアドレスが確認されていません。確認メールのリンクを開いてください",
        message: null,
      };
    }
    return { error: "メールアドレスまたはパスワードが正しくありません", message: null };
  }

  // redirect() は例外で処理を中断するため、try/catch の外で呼ぶ。
  redirect("/");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseCredentialsForm(formData);
  if (!parsed.ok) return { error: parsed.error, message: null };

  // 確認後の戻り先を、今開いているサイト（localhost / 本番）の /auth/confirm にする。
  // この URL は Supabase の Redirect URLs に登録が必要（未登録だと Site URL に戻される）。
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: origin ? { emailRedirectTo: `${origin}/auth/confirm` } : undefined,
  });
  if (error) {
    console.error("新規登録に失敗しました:", error.message);
    if (error.code === "weak_password") {
      return { error: "パスワードが弱すぎます。別のパスワードを入力してください", message: null };
    }
    return { error: "新規登録に失敗しました。時間をおいて再度お試しください", message: null };
  }

  // メール確認が有効な場合はセッションが発行されない。
  if (!data.session) {
    return {
      error: null,
      message: "確認メールを送信しました。メールのリンクを開いてから、ログインしてください",
    };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("ログアウトに失敗しました:", error.message);
  }
  redirect("/login");
}
