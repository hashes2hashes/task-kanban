import { afterEach, describe, expect, it, vi } from "vitest";
import { getTasks } from "./queries";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

function mockSelectResult(result: { data: unknown; error: { message: string } | null }) {
  const order = vi.fn().mockResolvedValue(result);
  const select = vi.fn(() => ({ order }));
  createClientMock.mockResolvedValue({ from: vi.fn(() => ({ select })) });
  return { order };
}

const baseRow = {
  description: "",
  created_at: "2026-11-15T00:00:00Z",
  updated_at: "2026-11-15T00:00:00Z",
  user_id: "user-1",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("getTasks", () => {
  it("取得したタスクを作成日時の古い順で返す", async () => {
    const rows = [
      { ...baseRow, id: "1", title: "A", status: "todo" },
      { ...baseRow, id: "2", title: "B", status: "done" },
    ];
    const { order } = mockSelectResult({ data: rows, error: null });

    await expect(getTasks()).resolves.toEqual({ ok: true, tasks: rows });
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("タスクが 0 件だと、空配列を返す", async () => {
    mockSelectResult({ data: [], error: null });

    await expect(getTasks()).resolves.toEqual({ ok: true, tasks: [] });
  });

  it("定義外のステータスを持つ行は、一覧から除外する", async () => {
    mockSelectResult({
      data: [
        { ...baseRow, id: "1", title: "A", status: "archived" },
        { ...baseRow, id: "2", title: "B", status: "in_progress" },
      ],
      error: null,
    });

    const result = await getTasks();

    expect(result.ok && result.tasks.map((task) => task.id)).toEqual(["2"]);
  });

  it("DB がエラーを返すと、例外を投げずに失敗として理由を返す", async () => {
    mockSelectResult({ data: null, error: { message: "boom" } });

    await expect(getTasks()).resolves.toEqual({ ok: false, reason: "boom" });
  });
});
