/** パスワードの最小文字数（Supabase Auth の既定値に合わせる）。 */
export const passwordMinLength = 6;

export type Credentials = {
  email: string;
  password: string;
};

export type CredentialsParseResult =
  | { ok: true; data: Credentials }
  | { ok: false; error: string };

// 厳密な RFC 準拠ではなく、明らかな入力ミスを弾く程度の確認にとどめる（最終判定は Supabase）。
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ログイン・新規登録フォームの入力を取り出し、検証する。 */
export function parseCredentialsForm(formData: FormData): CredentialsParseResult {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  // パスワードは空白も有効な文字なので trim しない。
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (email.length === 0) {
    return { ok: false, error: "メールアドレスを入力してください" };
  }
  if (!emailPattern.test(email)) {
    return { ok: false, error: "メールアドレスの形式が正しくありません" };
  }
  if (password.length === 0) {
    return { ok: false, error: "パスワードを入力してください" };
  }
  if (password.length < passwordMinLength) {
    return {
      ok: false,
      error: `パスワードは ${passwordMinLength} 文字以上で入力してください`,
    };
  }

  return { ok: true, data: { email, password } };
}
