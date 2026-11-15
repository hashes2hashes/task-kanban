import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthAction, AuthActionState } from "@/app/auth/actions";
import { ResetPasswordForm } from "./reset-password-form";

function renderForm(result: AuthActionState = { error: null, message: null }) {
  const action = vi.fn<AuthAction>().mockResolvedValue(result);
  const user = userEvent.setup();
  render(<ResetPasswordForm action={action} />);
  return { user, action };
}

// type="password" の入力は textbox ロールを持たないため、ラベルで取得する。
const passwordInput = () => screen.getByLabelText("新しいパスワード");
const confirmationInput = () => screen.getByLabelText("新しいパスワード（確認用）");
const submitButton = () => screen.getByRole("button", { name: "パスワードを変更" });

describe("ResetPasswordForm", () => {
  it("新しいパスワードと確認用を入力して送信すると、その内容でアクションが呼ばれる", async () => {
    const { user, action } = renderForm();
    await user.type(passwordInput(), "newpass1");
    await user.type(confirmationInput(), "newpass1");

    await user.click(submitButton());

    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData.entries())).toEqual({
      password: "newpass1",
      passwordConfirmation: "newpass1",
    });
  });

  it("確認用のパスワードが一致しないと、送信せずにエラーを表示する", async () => {
    const { user, action } = renderForm();
    await user.type(passwordInput(), "newpass1");
    await user.type(confirmationInput(), "newpass2");

    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("確認用のパスワードが一致しません");
    expect(action).not.toHaveBeenCalled();
  });

  it("パスワードが 5 文字だと、送信せずに文字数エラーを表示する", async () => {
    const { user, action } = renderForm();
    await user.type(passwordInput(), "12345");
    await user.type(confirmationInput(), "12345");

    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "パスワードは 6 文字以上で入力してください",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("サーバーがエラーを返すと、エラーを表示し入力内容を残す", async () => {
    const { user } = renderForm({
      error: "現在と同じパスワードは使えません。別のパスワードを入力してください",
      message: null,
    });
    await user.type(passwordInput(), "newpass1");
    await user.type(confirmationInput(), "newpass1");

    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("現在と同じパスワードは使えません");
    expect(passwordInput()).toHaveValue("newpass1");
    expect(confirmationInput()).toHaveValue("newpass1");
  });
});
