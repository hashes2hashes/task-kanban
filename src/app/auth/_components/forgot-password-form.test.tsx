import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthAction, AuthActionState } from "@/app/auth/actions";
import { ForgotPasswordForm } from "./forgot-password-form";

function renderForm(result: AuthActionState = { error: null, message: null }) {
  const action = vi.fn<AuthAction>().mockResolvedValue(result);
  const user = userEvent.setup();
  render(<ForgotPasswordForm action={action} />);
  return { user, action };
}

const emailInput = () => screen.getByRole("textbox", { name: "メールアドレス" });
const submitButton = () => screen.getByRole("button", { name: "再設定用のメールを送信" });

describe("ForgotPasswordForm", () => {
  it("メールアドレスを入力して送信すると、その内容でアクションが呼ばれる", async () => {
    const { user, action } = renderForm();
    await user.type(emailInput(), "user@example.com");

    await user.click(submitButton());

    const formData = action.mock.calls[0][1];
    expect(Object.fromEntries(formData.entries())).toEqual({ email: "user@example.com" });
  });

  it("メールアドレスの形式が不正だと、送信せずにエラーを表示する", async () => {
    const { user, action } = renderForm();
    await user.type(emailInput(), "user@example");

    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールアドレスの形式が正しくありません",
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("送信に成功すると、案内を表示しメールアドレスを残す", async () => {
    const { user } = renderForm({ error: null, message: "再設定用のメールを送信しました" });
    await user.type(emailInput(), "user@example.com");

    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("再設定用のメールを送信しました");
    expect(emailInput()).toHaveValue("user@example.com");
  });

  it("サーバーがエラーを返すと、エラーを表示する", async () => {
    const { user } = renderForm({
      error: "メールの送信回数が上限に達しました。しばらく待ってから再度お試しください",
      message: null,
    });
    await user.type(emailInput(), "user@example.com");

    await user.click(submitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "メールの送信回数が上限に達しました",
    );
  });
});
