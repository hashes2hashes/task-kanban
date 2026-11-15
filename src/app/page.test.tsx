import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

// async Server Component は Vitest で描画できないため、データ取得部分は差し替える（E2E で検証する）。
vi.mock("./_components/task-board-loader", () => ({
  TaskBoardLoader: () => <div>ボード</div>,
}));
vi.mock("./_components/user-menu", () => ({
  UserMenu: () => <div>ユーザーメニュー</div>,
}));

describe("Home", () => {
  it("見出しが表示される", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "タスクカンバン" }),
    ).toBeInTheDocument();
  });
});
