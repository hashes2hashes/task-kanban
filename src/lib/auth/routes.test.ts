import { describe, expect, it } from "vitest";
import { getAuthRedirect } from "./routes";

describe("getAuthRedirect", () => {
  it("未ログインでトップを開くと、/login へリダイレクトする", () => {
    expect(getAuthRedirect("/", false)).toBe("/login");
  });

  it("未ログインでログイン・新規登録画面を開くと、リダイレクトしない", () => {
    expect(getAuthRedirect("/login", false)).toBeNull();
    expect(getAuthRedirect("/signup", false)).toBeNull();
  });

  it("未ログインでも /auth/ 配下（確認メールのリンク先）はリダイレクトしない", () => {
    expect(getAuthRedirect("/auth/confirm", false)).toBeNull();
  });

  it("/auth と前方一致するだけの別パスは公開扱いしない", () => {
    expect(getAuthRedirect("/authors", false)).toBe("/login");
  });

  it("ログイン済みでトップを開くと、リダイレクトしない", () => {
    expect(getAuthRedirect("/", true)).toBeNull();
  });

  it("ログイン済みでログイン・新規登録画面を開くと、トップへリダイレクトする", () => {
    expect(getAuthRedirect("/login", true)).toBe("/");
    expect(getAuthRedirect("/signup", true)).toBe("/");
  });

  it("ログイン済みで /auth/ 配下を開くと、リダイレクトしない", () => {
    expect(getAuthRedirect("/auth/confirm", true)).toBeNull();
  });

  it("未ログインでパスワード再設定の申請画面を開くと、リダイレクトしない", () => {
    expect(getAuthRedirect("/forgot-password", false)).toBeNull();
  });

  it("ログイン済みでパスワード再設定の申請画面を開くと、トップへリダイレクトする", () => {
    expect(getAuthRedirect("/forgot-password", true)).toBe("/");
  });

  it("未ログインで新しいパスワードの入力画面を開くと、/login へリダイレクトする", () => {
    expect(getAuthRedirect("/reset-password", false)).toBe("/login");
  });

  it("ログイン済みで新しいパスワードの入力画面を開くと、リダイレクトしない", () => {
    expect(getAuthRedirect("/reset-password", true)).toBeNull();
  });
});
