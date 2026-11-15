import { describe, expect, it } from "vitest";
import {
  parseCredentialsForm,
  parseEmailForm,
  parseNewPasswordForm,
  passwordMinLength,
} from "./validation";

function buildForm(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("parseCredentialsForm", () => {
  it("メールアドレスとパスワードが正しいと、前後の空白を除いたメールアドレスとパスワードを返す", () => {
    const result = parseCredentialsForm(
      buildForm({ email: " user@example.com ", password: "secret1" }),
    );

    expect(result).toEqual({
      ok: true,
      data: { email: "user@example.com", password: "secret1" },
    });
  });

  it("パスワードの前後の空白は取り除かずにそのまま返す", () => {
    const result = parseCredentialsForm(
      buildForm({ email: "user@example.com", password: " pass word " }),
    );

    expect(result).toEqual({
      ok: true,
      data: { email: "user@example.com", password: " pass word " },
    });
  });

  it("メールアドレスが空（空白のみを含む）だと、入力を求めるエラーを返す", () => {
    expect(parseCredentialsForm(buildForm({ email: "  ", password: "secret1" }))).toEqual({
      ok: false,
      error: "メールアドレスを入力してください",
    });
  });

  it("メールアドレスが未送信だと、入力を求めるエラーを返す", () => {
    expect(parseCredentialsForm(buildForm({ password: "secret1" }))).toEqual({
      ok: false,
      error: "メールアドレスを入力してください",
    });
  });

  it.each(["user", "user@", "@example.com", "user@example", "us er@example.com"])(
    "メールアドレスが「%s」だと、形式エラーを返す",
    (email) => {
      expect(parseCredentialsForm(buildForm({ email, password: "secret1" }))).toEqual({
        ok: false,
        error: "メールアドレスの形式が正しくありません",
      });
    },
  );

  it("パスワードが空だと、入力を求めるエラーを返す", () => {
    expect(
      parseCredentialsForm(buildForm({ email: "user@example.com", password: "" })),
    ).toEqual({ ok: false, error: "パスワードを入力してください" });
  });

  it(`パスワードが ${passwordMinLength - 1} 文字だと、文字数エラーを返す`, () => {
    expect(
      parseCredentialsForm(
        buildForm({ email: "user@example.com", password: "a".repeat(passwordMinLength - 1) }),
      ),
    ).toEqual({
      ok: false,
      error: `パスワードは ${passwordMinLength} 文字以上で入力してください`,
    });
  });

  it(`パスワードがちょうど ${passwordMinLength} 文字だと、受け付ける`, () => {
    const result = parseCredentialsForm(
      buildForm({ email: "user@example.com", password: "a".repeat(passwordMinLength) }),
    );

    expect(result.ok).toBe(true);
  });
});

describe("parseEmailForm", () => {
  it("メールアドレスが正しいと、前後の空白を除いたメールアドレスを返す", () => {
    expect(parseEmailForm(buildForm({ email: " user@example.com " }))).toEqual({
      ok: true,
      data: { email: "user@example.com" },
    });
  });

  it("メールアドレスが空だと、入力を求めるエラーを返す", () => {
    expect(parseEmailForm(buildForm({ email: "" }))).toEqual({
      ok: false,
      error: "メールアドレスを入力してください",
    });
  });

  it("メールアドレスの形式が不正だと、形式エラーを返す", () => {
    expect(parseEmailForm(buildForm({ email: "user@example" }))).toEqual({
      ok: false,
      error: "メールアドレスの形式が正しくありません",
    });
  });
});

describe("parseNewPasswordForm", () => {
  it("パスワードと確認用が一致すると、パスワードを trim せずに返す", () => {
    expect(
      parseNewPasswordForm(
        buildForm({ password: " secret1 ", passwordConfirmation: " secret1 " }),
      ),
    ).toEqual({ ok: true, data: { password: " secret1 " } });
  });

  it("パスワードが空だと、入力を求めるエラーを返す", () => {
    expect(
      parseNewPasswordForm(buildForm({ password: "", passwordConfirmation: "" })),
    ).toEqual({ ok: false, error: "パスワードを入力してください" });
  });

  it(`パスワードが ${passwordMinLength - 1} 文字だと、文字数エラーを返す`, () => {
    const password = "a".repeat(passwordMinLength - 1);

    expect(
      parseNewPasswordForm(buildForm({ password, passwordConfirmation: password })),
    ).toEqual({
      ok: false,
      error: `パスワードは ${passwordMinLength} 文字以上で入力してください`,
    });
  });

  it(`パスワードがちょうど ${passwordMinLength} 文字で確認用と一致すると、受け付ける`, () => {
    const password = "a".repeat(passwordMinLength);

    expect(
      parseNewPasswordForm(buildForm({ password, passwordConfirmation: password })).ok,
    ).toBe(true);
  });

  it("確認用のパスワードが一致しないと、不一致のエラーを返す", () => {
    expect(
      parseNewPasswordForm(buildForm({ password: "secret1", passwordConfirmation: "secret2" })),
    ).toEqual({ ok: false, error: "確認用のパスワードが一致しません" });
  });

  it("確認用のパスワードが未送信だと、不一致のエラーを返す", () => {
    expect(parseNewPasswordForm(buildForm({ password: "secret1" }))).toEqual({
      ok: false,
      error: "確認用のパスワードが一致しません",
    });
  });
});
