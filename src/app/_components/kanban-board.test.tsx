import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/tasks/types";
import { KanbanBoard } from "./kanban-board";

function buildTask(id: string, title: string, status: Task["status"]): Task {
  return {
    id,
    title,
    status,
    description: "",
    created_at: "2026-11-15T00:00:00Z",
    updated_at: "2026-11-15T00:00:00Z",
  };
}

function renderBoard(tasks: Task[]) {
  const action = vi.fn().mockResolvedValue({ error: null });
  render(
    <KanbanBoard
      tasks={tasks}
      createAction={action}
      updateAction={action}
      deleteAction={action}
    />,
  );
}

function taskTitlesIn(columnName: string) {
  const column = screen.getByRole("region", { name: columnName });
  return within(column)
    .queryAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

describe("KanbanBoard", () => {
  it("Todo / In Progress / Done の3列が表示され、追加フォームがある", () => {
    renderBoard([]);

    expect(screen.getByRole("region", { name: "Todo" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "In Progress" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "追加" })).toBeInTheDocument();
  });

  it("タスクはステータスに対応する列に、渡された順で表示される", () => {
    renderBoard([
      buildTask("1", "設計", "done"),
      buildTask("2", "実装", "in_progress"),
      buildTask("3", "テスト", "todo"),
      buildTask("4", "レビュー", "todo"),
    ]);

    expect(taskTitlesIn("Todo")).toEqual(["テスト", "レビュー"]);
    expect(taskTitlesIn("In Progress")).toEqual(["実装"]);
    expect(taskTitlesIn("Done")).toEqual(["設計"]);
  });

  it("各列に、その列のタスク件数が表示される", () => {
    renderBoard([buildTask("1", "A", "todo"), buildTask("2", "B", "todo")]);

    expect(
      within(screen.getByRole("region", { name: "Todo" })).getByText("2 件"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Done" })).getByText("0 件"),
    ).toBeInTheDocument();
  });

  it("タスクのない列には、タスクがない旨が表示される", () => {
    renderBoard([buildTask("1", "A", "todo")]);

    const done = screen.getByRole("region", { name: "Done" });
    expect(within(done).getByText("タスクはありません")).toBeInTheDocument();
    const todo = screen.getByRole("region", { name: "Todo" });
    expect(within(todo).queryByText("タスクはありません")).not.toBeInTheDocument();
  });
});
