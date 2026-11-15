import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ActionState } from "@/app/actions";
import type { Task } from "@/lib/tasks/types";
import { TaskCard } from "./task-card";

const task: Task = {
  id: "task-1",
  title: "買い物",
  description: "牛乳を買う",
  status: "todo",
  created_at: "2026-11-15T00:00:00Z",
  updated_at: "2026-11-15T00:00:00Z",
};

type TaskAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

function renderCard(options: { updateResult?: ActionState; deleteResult?: ActionState } = {}) {
  const updateAction = vi.fn<TaskAction>().mockResolvedValue(
    options.updateResult ?? { error: null },
  );
  const deleteAction = vi.fn<TaskAction>().mockResolvedValue(
    options.deleteResult ?? { error: null },
  );
  const user = userEvent.setup();
  render(
    <TaskCard task={task} updateAction={updateAction} deleteAction={deleteAction} />,
  );
  return { user, updateAction, deleteAction };
}

function submittedFields(action: ReturnType<typeof vi.fn<TaskAction>>) {
  const formData = action.mock.calls[0][1];
  return Object.fromEntries(formData.entries());
}

describe("TaskCard 表示", () => {
  it("タイトルと説明、編集・削除ボタンが表示される", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "買い物" })).toBeInTheDocument();
    expect(screen.getByText("牛乳を買う")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "「買い物」を編集" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "「買い物」を削除" })).toBeInTheDocument();
  });
});

describe("TaskCard 編集", () => {
  it("編集ボタンを押すと、現在の値が入った編集フォームに切り替わる", async () => {
    const { user } = renderCard();

    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));

    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("買い物");
    expect(screen.getByRole("textbox", { name: "説明" })).toHaveValue("牛乳を買う");
    expect(screen.getByRole("combobox", { name: "ステータス" })).toHaveValue("todo");
  });

  it("編集中にキャンセルを押すと、変更を保存せず元の表示に戻る", async () => {
    const { user, updateAction } = renderCard();
    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "追記");

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(screen.getByRole("heading", { name: "買い物" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "タイトル" })).not.toBeInTheDocument();
    expect(updateAction).not.toHaveBeenCalled();
  });

  it("キャンセル後にもう一度編集すると、編集前の値から始まる", async () => {
    const { user } = renderCard();
    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    await user.clear(screen.getByRole("textbox", { name: "タイトル" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));

    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("買い物");
  });

  it("タイトルとステータスを変えて保存すると、id 付きで更新が送信され表示に戻る", async () => {
    const { user, updateAction } = renderCard();
    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    const titleInput = screen.getByRole("textbox", { name: "タイトル" });
    await user.clear(titleInput);
    await user.type(titleInput, "夕飯の買い物");
    await user.selectOptions(screen.getByRole("combobox", { name: "ステータス" }), "In Progress");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(submittedFields(updateAction)).toEqual({
      id: "task-1",
      title: "夕飯の買い物",
      description: "牛乳を買う",
      status: "in_progress",
    });
    expect(await screen.findByRole("button", { name: "「買い物」を編集" })).toBeInTheDocument();
  });

  it("タイトルを空にして保存すると、送信せずにエラーを表示し編集を続ける", async () => {
    const { user, updateAction } = renderCard();
    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    await user.clear(screen.getByRole("textbox", { name: "タイトル" }));

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("タイトルを入力してください");
    expect(updateAction).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "タイトル" })).toBeInTheDocument();
  });

  it("保存がサーバーエラーになると、エラーを表示し入力を残したまま編集を続ける", async () => {
    const { user } = renderCard({ updateResult: { error: "タスクの更新に失敗しました" } });
    await user.click(screen.getByRole("button", { name: "「買い物」を編集" }));
    await user.type(screen.getByRole("textbox", { name: "タイトル" }), "!");

    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("タスクの更新に失敗しました");
    expect(screen.getByRole("textbox", { name: "タイトル" })).toHaveValue("買い物!");
  });
});

describe("TaskCard 削除", () => {
  it("削除ボタンを押すと、タスク名入りの確認ダイアログが表示され、まだ削除されない", async () => {
    const { user, deleteAction } = renderCard();

    await user.click(screen.getByRole("button", { name: "「買い物」を削除" }));

    const dialog = screen.getByRole("alertdialog", { name: "タスクの削除" });
    expect(dialog).toHaveTextContent("「買い物」を削除しますか？");
    expect(deleteAction).not.toHaveBeenCalled();
  });

  it("確認ダイアログでキャンセルすると、ダイアログが閉じて削除されない", async () => {
    const { user, deleteAction } = renderCard();
    await user.click(screen.getByRole("button", { name: "「買い物」を削除" }));

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "キャンセル" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteAction).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "買い物" })).toBeInTheDocument();
  });

  it("確認ダイアログで削除すると、id 付きで削除が送信されダイアログが閉じる", async () => {
    const { user, deleteAction } = renderCard();
    await user.click(screen.getByRole("button", { name: "「買い物」を削除" }));

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }),
    );

    expect(submittedFields(deleteAction)).toEqual({ id: "task-1" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("削除がサーバーエラーになると、カードにエラーを表示する", async () => {
    const { user } = renderCard({ deleteResult: { error: "タスクの削除に失敗しました" } });
    await user.click(screen.getByRole("button", { name: "「買い物」を削除" }));

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "削除する" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("タスクの削除に失敗しました");
  });
});
