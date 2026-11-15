/** パスワードの最小文字数（Supabase Auth の既定値に合わせる）。 */
export const passwordMinLength = 6;

export type Credentials = {
  email: string;
  password: string;
};

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type CredentialsParseResult = ParseResult<Credentials>;

// 厳密な RFC 準拠ではなく、明らかな入力ミスを弾く程度の確認にとどめる（最終判定は Supabase）。
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** メールアドレスを検証する。問題がなければ null、あればエラー文言を返す。 */
function validateEmail(email: string): string | null {
  if (email.length === 0) return "メールアドレスを入力してください";
  if (!emailPattern.test(email)) return "メールアドレスの形式が正しくありません";
  return null;
}

/** パスワードを検証する。問題がなければ null、あればエラー文言を返す。 */
function validatePassword(password: string): string | null {
  if (password.length === 0) return "パスワードを入力してください";
  if (password.length < passwordMinLength) {
    return `パスワードは ${passwordMinLength} 文字以上で入力してください`;
  }
  return null;
}

/** ログイン・新規登録フォームの入力を取り出し、検証する。 */
export function parseCredentialsForm(formData: FormData): CredentialsParseResult {
  const email = readString(formData, "email").trim();
  // パスワードは空白も有効な文字なので trim しない。
  const password = readString(formData, "password");

  const error = validateEmail(email) ?? validatePassword(password);
  if (error) return { ok: false, error };
  return { ok: true, data: { email, password } };
}

/** パスワード再設定の申請フォーム（メールアドレスのみ）の入力を取り出し、検証する。 */
export function parseEmailForm(formData: FormData): ParseResult<{ email: string }> {
  const email = readString(formData, "email").trim();

  const error = validateEmail(email);
  if (error) return { ok: false, error };
  return { ok: true, data: { email } };
}

/** 新しいパスワードの入力フォーム（パスワードと確認用）の入力を取り出し、検証する。 */
export function parseNewPasswordForm(formData: FormData): ParseResult<{ password: string }> {
  const password = readString(formData, "password");
  const passwordConfirmation = readString(formData, "passwordConfirmation");

  const error = validatePassword(password);
  if (error) return { ok: false, error };
  if (password !== passwordConfirmation) {
    return { ok: false, error: "確認用のパスワードが一致しません" };
  }
  return { ok: true, data: { password } };
}
