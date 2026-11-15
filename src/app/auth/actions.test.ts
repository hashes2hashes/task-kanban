import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestPasswordReset, signIn, signOut, signUp, updatePassword } from "./actions";

// 外部依存（Supabase と Next.js のリクエスト API・リダイレクト）だけをモックする。
const { createClientMock, redirectMock, headersMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  redirectMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({ headers: headersMock }));

type AuthError = { code: string; message: string } | null;

function createFakeAuth(
  options: { error?: AuthError; session?: object | null; signedIn?: boolean } = {},
) {
  const result = { data: { session: options.session ?? null }, error: options.error ?? null };
  const signedIn = options.signedIn ?? true;
  const auth = {
    signInWithPassword: vi.fn().mockResolvedValue(result),
    signUp: vi.fn().mockResolvedValue(result),
    signOut: vi.fn().mockResolvedValue({ error: options.error ?? null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: options.error ?? null }),
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: options.error ?? null }),
    getClaims: vi.fn().mockResolvedValue(
      signedIn
        ? { data: { claims: { sub: "user-1", email: "user@example.com" } }, error: null }
        : { data: null, error: null },
    ),
  };
  createClientMock.mockResolvedValue({ auth });
  return auth;
}

function buildForm(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

const initialState = { error: null, message: null };
const validForm = () => buildForm({ email: "user@example.com", password: "secret1" });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  headersMock.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("signIn", () => {
  it("正しい入力でログインに成功すると、トップへリダイレクトする", async () => {
    const auth = createFakeAuth();

    await signIn(initialState, validForm());

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret1",
    });
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("入力が不正だと、Supabase を呼ばずに検証エラーを返す", async () => {
    const auth = createFakeAuth();

    const result = await signIn(initialState, buildForm({ email: "", password: "secret1" }));

    expect(result).toEqual({ error: "メールアドレスを入力してください", message: null });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("認証に失敗すると、どちらが誤りかを明かさないエラーを返し、リダイレクトしない", async () => {
    createFakeAuth({ error: { code: "invalid_credentials", message: "Invalid login credentials" } });

    const result = await signIn(initialState, validForm());

    expect(result).toEqual({
      error: "メールアドレスまたはパスワードが正しくありません",
      message: null,
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("メールアドレスが未確認だと、確認を促すエラーを返す", async () => {
    createFakeAuth({ error: { code: "email_not_confirmed", message: "Email not confirmed" } });

    const result = await signIn(initialState, validForm());

    expect(result.error).toContain("メールアドレスが確認されていません");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("signUp", () => {
  it("メール確認が必要な場合は、確認メール送信のメッセージを返し、リダイレクトしない", async () => {
    const auth = createFakeAuth({ session: null });

    const result = await signUp(initialState, validForm());

    expect(auth.signUp).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret1",
      options: { emailRedirectTo: "http://localhost:3000/auth/confirm" },
    });
    expect(result).toEqual({
      error: null,
      message: "確認メールを送信しました。メールのリンクを開いてから、ログインしてください",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("メール確認なしでセッションが発行された場合は、トップへリダイレクトする", async () => {
    createFakeAuth({ session: { access_token: "token" } });

    await signUp(initialState, validForm());

    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("Origin ヘッダーがないと、リダイレクト先を指定せずに登録する", async () => {
    headersMock.mockResolvedValue(new Headers());
    const auth = createFakeAuth();

    await signUp(initialState, validForm());

    expect(auth.signUp).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret1",
      options: undefined,
    });
  });

  it("入力が不正だと、Supabase を呼ばずに検証エラーを返す", async () => {
    const auth = createFakeAuth();

    const result = await signUp(
      initialState,
      buildForm({ email: "user@example.com", password: "12345" }),
    );

    expect(result).toEqual({ error: "パスワードは 6 文字以上で入力してください", message: null });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("パスワードが弱いと判定されると、別のパスワードを促すエラーを返す", async () => {
    createFakeAuth({ error: { code: "weak_password", message: "weak" } });

    const result = await signUp(initialState, validForm());

    expect(result.error).toContain("パスワードが弱すぎます");
  });

  it("その他の理由で失敗すると、汎用のエラーを返す", async () => {
    createFakeAuth({ error: { code: "over_email_send_rate_limit", message: "rate limit" } });

    const result = await signUp(initialState, validForm());

    expect(result).toEqual({
      error: "新規登録に失敗しました。時間をおいて再度お試しください",
      message: null,
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("requestPasswordReset", () => {
  it("正しいメールアドレスだと、/auth/confirm に戻すよう指定して再設定メールを送り、案内を返す", async () => {
    const auth = createFakeAuth();

    const result = await requestPasswordReset(
      initialState,
      buildForm({ email: " user@example.com " }),
    );

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "http://localhost:3000/auth/confirm",
    });
    expect(result).toEqual({
      error: null,
      message:
        "登録済みのメールアドレスであれば、再設定用のメールを送信しました。メールのリンクを開いてください",
    });
  });

  it("Origin ヘッダーがないと、戻り先を指定せずに送る", async () => {
    headersMock.mockResolvedValue(new Headers());
    const auth = createFakeAuth();

    await requestPasswordReset(initialState, buildForm({ email: "user@example.com" }));

    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("user@example.com", undefined);
  });

  it("メールアドレスが不正だと、Supabase を呼ばずに検証エラーを返す", async () => {
    const auth = createFakeAuth();

    const result = await requestPasswordReset(initialState, buildForm({ email: "user" }));

    expect(result).toEqual({ error: "メールアドレスの形式が正しくありません", message: null });
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("送信回数の上限に達すると、待つよう促すエラーを返す", async () => {
    createFakeAuth({ error: { code: "over_email_send_rate_limit", message: "rate limit" } });

    const result = await requestPasswordReset(
      initialState,
      buildForm({ email: "user@example.com" }),
    );

    expect(result).toEqual({
      error: "メールの送信回数が上限に達しました。しばらく待ってから再度お試しください",
      message: null,
    });
  });

  it("その他の理由で失敗すると、汎用のエラーを返す", async () => {
    createFakeAuth({ error: { code: "unexpected_failure", message: "failed" } });

    const result = await requestPasswordReset(
      initialState,
      buildForm({ email: "user@example.com" }),
    );

    expect(result).toEqual({
      error: "メールを送信できませんでした。時間をおいて再度お試しください",
      message: null,
    });
  });
});

describe("updatePassword", () => {
  const validPasswordForm = () =>
    buildForm({ password: "newpass1", passwordConfirmation: "newpass1" });

  it("ログイン中に正しく入力すると、パスワードを変更してトップへリダイレクトする", async () => {
    const auth = createFakeAuth();

    await updatePassword(initialState, validPasswordForm());

    expect(auth.updateUser).toHaveBeenCalledWith({ password: "newpass1" });
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("確認用のパスワードが一致しないと、Supabase を呼ばずに検証エラーを返す", async () => {
    const auth = createFakeAuth();

    const result = await updatePassword(
      initialState,
      buildForm({ password: "newpass1", passwordConfirmation: "newpass2" }),
    );

    expect(result).toEqual({ error: "確認用のパスワードが一致しません", message: null });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("未ログインだと、パスワードを変更せずに再申請を促すエラーを返す", async () => {
    const auth = createFakeAuth({ signedIn: false });

    const result = await updatePassword(initialState, validPasswordForm());

    expect(result).toEqual({
      error: "ログインが必要です。もう一度、再設定用のメールを申請してください",
      message: null,
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("現在と同じパスワードだと、別のパスワードを促すエラーを返す", async () => {
    createFakeAuth({ error: { code: "same_password", message: "same" } });

    const result = await updatePassword(initialState, validPasswordForm());

    expect(result.error).toContain("現在と同じパスワードは使えません");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("パスワードが弱いと判定されると、別のパスワードを促すエラーを返す", async () => {
    createFakeAuth({ error: { code: "weak_password", message: "weak" } });

    const result = await updatePassword(initialState, validPasswordForm());

    expect(result.error).toContain("パスワードが弱すぎます");
  });

  it("その他の理由で失敗すると、汎用のエラーを返し、リダイレクトしない", async () => {
    createFakeAuth({ error: { code: "unexpected_failure", message: "failed" } });

    const result = await updatePassword(initialState, validPasswordForm());

    expect(result).toEqual({
      error: "パスワードを変更できませんでした。時間をおいて再度お試しください",
      message: null,
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("ログアウトして、ログイン画面へリダイレクトする", async () => {
    const auth = createFakeAuth();

    await signOut();

    expect(auth.signOut).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("ログアウトに失敗しても、ログイン画面へリダイレクトする", async () => {
    createFakeAuth({ error: { code: "unexpected_failure", message: "failed" } });

    await signOut();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
