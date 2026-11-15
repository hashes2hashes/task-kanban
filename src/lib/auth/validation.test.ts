import { describe, expect, it } from "vitest";
import { parseCredentialsForm, passwordMinLength } from "./validation";

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
