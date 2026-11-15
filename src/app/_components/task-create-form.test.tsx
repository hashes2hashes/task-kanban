import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/app/actions";
import { TaskCreateForm } from "./task-create-form";

type TaskAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

function renderForm(result: ActionState = { error: null }) {
  const createAction = vi.fn<TaskAction>().mockResolvedValue(result);
  const user = userEvent.setup();
  render(<TaskCreateForm createAction={createAction} />);
  return { user, createAction };
}

describe("TaskCreateForm", () => {
  it("タイトルと説明を入力して追加すると、その内容で追加が送信され入力欄が空になる", async () => {
    const { user, createAction } = renderForm();
    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "買い物");
    await user.type(screen.getByRole("textbox", { name: "説明" }), "牛乳");

    await user.click(screen.getByRole("button", { name: "追加" }));

    const formData = createAction.mock.calls[0][1];
    expect(Object.fromEntries(formData.entries())).toEqual({
      title: "買い物",
      description: "牛乳",
    });
    expect(await screen.findByRole("textbox", { name: "タイトル" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "説明" })).toHaveValue("");
  });

  it("タイトルが空のまま追加すると、送信せずにエラーを表示する", async () => {
    const { user, createAction } = renderForm();

    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(createAction).not.toHaveBeenCalled();
  });

  it("サーバーがエラーを返すと、エラーを表示し入力内容を残す", async () => {
    const { user } = renderForm({ error: "タスクの追加に失敗しました" });
    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "買い物");

    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("タスクの追加に失敗しました");
    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("買い物");
  });

  it("エラー表示後に正しく追加し直すと、エラーが消える", async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole("button", { name: "追加" }));
    await screen.findByRole("alert");

    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "買い物");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(await screen.findByRole("textbox", { name: "タイトル" })).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("タイトルは 100 文字までしか入力できない", async () => {
    const { user } = renderForm();

    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "a".repeat(101));

    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("a".repeat(100));
  });
});
