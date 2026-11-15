import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

function renderDialog() {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      title="タスクの削除"
      message="「買い物」を削除しますか？"
      confirmLabel="削除する"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("タイトルとメッセージを持つ確認ダイアログが表示され、キャンセルにフォーカスが当たる", async () => {
    renderDialog();

    const dialog = screen.getByRole("alertdialog", { name: "タスクの削除" });
    expect(dialog).toHaveTextContent("「買い物」を削除しますか？");
    // Base UI はダイアログを開いた次のフレームで初期フォーカスを移す。
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "キャンセル" })).toHaveFocus(),
    );
  });

  it("確定ボタンを押すと、onConfirm だけが呼ばれる", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole("button", { name: "削除する" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("キャンセルボタンを押すと、onCancel だけが呼ばれる", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Esc キーを押すと、onCancel が呼ばれる", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
