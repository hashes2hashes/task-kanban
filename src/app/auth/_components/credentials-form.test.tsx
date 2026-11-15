import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthAction, AuthActionState } from "@/app/auth/actions";
import { CredentialsForm } from "./credentials-form";

function renderForm(result: AuthActionState = { error: null, message: null }) {
  const action = vi.fn<AuthAction>().mockResolvedValue(result);
  const user = userEvent.setup();
  render(
    <CredentialsForm
      action={action}
      submitLabel="ログイン"
      pendingLabel="ログイン中…"
      passwordAutoComplete="current-password"
    />,
  );
  return { user, action };
}

// type="password" の入力は textbox ロールを持たないため、ラベルで取得する。
const passwordInput = () => screen.getByLabelText("パスワード");
const emailInput = () => screen.getByRole("textbox", { name: "メールアドレス" });

describe("CredentialsForm", () => {
  it("メールアドレスとパスワードを入力して送信すると、その内容でアクションが呼ばれる", async () => {
    const { user, action } = renderForm();
    await user.type(emailInput(), "user@example.com");
    await user.type(passwordInput(), "secret1");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData.entries())).toEqual({
      email: "user@example.com",
      password: "secret1",
    });
  });

  it("メールアドレスが空のまま送信すると、送信せずにエラーを表示する", async () => {
    const { user, action } = renderForm();
    await user.type(passwordInput(), "secret1");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスを入力してください",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("パスワードが 5 文字だと、送信せずに文字数エラーを表示する", async () => {
    const { user, action } = renderForm();
    await user.type(emailInput(), "user@example.com");
    await user.type(passwordInput(), "12345");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "パスワードは 6 文字以上で入力してください",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("サーバーがエラーを返すと、エラーを表示し入力内容を残す", async () => {
    const { user } = renderForm({
      error: "メールアドレスまたはパスワードが正しくありません",
      message: null,
    });
    await user.type(emailInput(), "user@example.com");
    await user.type(passwordInput(), "secret1");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスまたはパスワードが正しくありません",
    );
    expect(emailInput()).toHaveValue("user@example.com");
    expect(passwordInput()).toHaveValue("secret1");
  });

  it("サーバーが成功メッセージを返すと、メッセージを表示しパスワードだけ空にする", async () => {
    const { user } = renderForm({ error: null, message: "確認メールを送信しました" });
    await user.type(emailInput(), "user@example.com");
    await user.type(passwordInput(), "secret1");

    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("確認メールを送信しました");
    expect(emailInput()).toHaveValue("user@example.com");
    expect(passwordInput()).toHaveValue("");
  });

  it("エラー表示後に正しく送信し直すと、エラーが消える", async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole("button", { name: "ログイン" }));
    await screen.findByRole("alert");

    await user.type(emailInput(), "user@example.com");
    await user.type(passwordInput(), "secret1");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await vi.waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
