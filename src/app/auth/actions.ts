"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth/session";
import {
  parseCredentialsForm,
  parseEmailForm,
  parseNewPasswordForm,
} from "@/lib/auth/validation";
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

  const confirmUrl = await getConfirmUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: confirmUrl ? { emailRedirectTo: confirmUrl } : undefined,
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

/**
 * パスワード再設定のメールを送る。メールアドレスが登録済みかどうかは明かさない
 * （Supabase も未登録のアドレスでエラーを返さない）。
 */
export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseEmailForm(formData);
  if (!parsed.ok) return { error: parsed.error, message: null };

  const confirmUrl = await getConfirmUrl();
  const supabase = await createClient();
  // PKCE の code verifier が Cookie に保存され、/auth/confirm で再設定用のリンクだと判別できる。
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    confirmUrl ? { redirectTo: confirmUrl } : undefined,
  );
  if (error) {
    console.error("パスワード再設定メールの送信に失敗しました:", error.message);
    if (error.code === "over_email_send_rate_limit") {
      return {
        error: "メールの送信回数が上限に達しました。しばらく待ってから再度お試しください",
        message: null,
      };
    }
    return {
      error: "メールを送信できませんでした。時間をおいて再度お試しください",
      message: null,
    };
  }

  return {
    error: null,
    message:
      "登録済みのメールアドレスであれば、再設定用のメールを送信しました。メールのリンクを開いてください",
  };
}

/** ログイン中のユーザーのパスワードを変更する（再設定用のリンクでログインした後に使う）。 */
export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = parseNewPasswordForm(formData);
  if (!parsed.ok) return { error: parsed.error, message: null };

  const supabase = await createClient();
  if (!(await getSignedInUser(supabase))) {
    return {
      error: "ログインが必要です。もう一度、再設定用のメールを申請してください",
      message: null,
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("パスワードの変更に失敗しました:", error.message);
    if (error.code === "same_password") {
      return { error: "現在と同じパスワードは使えません。別のパスワードを入力してください", message: null };
    }
    if (error.code === "weak_password") {
      return { error: "パスワードが弱すぎます。別のパスワードを入力してください", message: null };
    }
    return {
      error: "パスワードを変更できませんでした。時間をおいて再度お試しください",
      message: null,
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

/**
 * 確認メール・再設定メールのリンクの戻り先。今開いているサイト（localhost / 本番）の /auth/confirm。
 * この URL は Supabase の Redirect URLs に登録が必要（未登録だと Site URL に戻される）。
 * Origin ヘッダーがなければ null（Supabase の Site URL に任せる）。
 */
async function getConfirmUrl(): Promise<string | null> {
  const origin = (await headers()).get("origin");
  return origin ? `${origin}/auth/confirm` : null;
}
