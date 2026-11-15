import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTask, deleteTask, updateTask } from "./actions";

// 外部依存（Supabase と Next.js のキャッシュ API）だけをモックする。
const { createClientMock, refreshMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/cache", () => ({ refresh: refreshMock }));

type QueryResult = { data: unknown; error: { message: string } | null };

/** Supabase のクエリビルダーを模したフェイク。呼び出しを記録し、最後に result を返す。 */
function createFakeSupabase(result: QueryResult) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder = {
    then(resolve: (value: QueryResult) => void) {
      resolve(result);
    },
  } as Record<string, unknown>;
  ["insert", "update", "delete", "eq", "select"].forEach((method) => {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  });
  const from = vi.fn(() => builder);
  return { client: { from }, from, calls };
}

function buildForm(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

const initialState = { error: null };
const taskId = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("createTask", () => {
  it("入力が正しいと、tasks に追加して画面を更新し、エラーなしを返す", async () => {
    const fake = createFakeSupabase({ data: [{ id: taskId }], error: null });
    createClientMock.mockResolvedValue(fake.client);

    const result = await createTask(
      initialState,
      buildForm({ title: " 買い物 ", description: "牛乳" }),
    );

    expect(result).toEqual({ error: null });
    expect(fake.from).toHaveBeenCalledWith("tasks");
    expect(fake.calls).toContainEqual({
      method: "insert",
      args: [{ title: "買い物", description: "牛乳", status: "todo" }],
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("タイトルが空だと、DB を呼ばずに検証エラーを返す", async () => {
    const result = await createTask(initialState, buildForm({ title: "" }));

    expect(result).toEqual({ error: "タイトルを入力してください" });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("DB がエラーを返すと、追加失敗のエラーを返し画面を更新しない", async () => {
    const fake = createFakeSupabase({ data: null, error: { message: "boom" } });
    createClientMock.mockResolvedValue(fake.client);

    const result = await createTask(initialState, buildForm({ title: "買い物" }));

    expect(result).toEqual({ error: "タスクの追加に失敗しました" });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

describe("updateTask", () => {
  it("入力が正しいと、指定 id のタスクを更新して画面を更新する", async () => {
    const fake = createFakeSupabase({ data: [{ id: taskId }], error: null });
    createClientMock.mockResolvedValue(fake.client);

    const result = await updateTask(
      initialState,
      buildForm({ id: taskId, title: "買い物", description: "", status: "done" }),
    );

    expect(result).toEqual({ error: null });
    expect(fake.calls).toContainEqual({
      method: "update",
      args: [{ title: "買い物", description: "", status: "done" }],
    });
    expect(fake.calls).toContainEqual({ method: "eq", args: ["id", taskId] });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("id がないと、DB を呼ばずにエラーを返す", async () => {
    const result = await updateTask(initialState, buildForm({ title: "買い物" }));

    expect(result).toEqual({ error: "対象のタスクが指定されていません" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("不正なステータスだと、DB を呼ばずに検証エラーを返す", async () => {
    const result = await updateTask(
      initialState,
      buildForm({ id: taskId, title: "買い物", status: "archived" }),
    );

    expect(result).toEqual({ error: "ステータスが不正です" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("対象のタスクが存在しないと、見つからない旨のエラーを返し画面を更新する", async () => {
    const fake = createFakeSupabase({ data: [], error: null });
    createClientMock.mockResolvedValue(fake.client);

    const result = await updateTask(
      initialState,
      buildForm({ id: taskId, title: "買い物" }),
    );

    expect(result).toEqual({ error: "タスクが見つかりません。削除された可能性があります" });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("DB がエラーを返すと、更新失敗のエラーを返し画面を更新しない", async () => {
    const fake = createFakeSupabase({ data: null, error: { message: "boom" } });
    createClientMock.mockResolvedValue(fake.client);

    const result = await updateTask(
      initialState,
      buildForm({ id: taskId, title: "買い物" }),
    );

    expect(result).toEqual({ error: "タスクの更新に失敗しました" });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  it("id を指定すると、そのタスクを削除して画面を更新する", async () => {
    const fake = createFakeSupabase({ data: [{ id: taskId }], error: null });
    createClientMock.mockResolvedValue(fake.client);

    const result = await deleteTask(initialState, buildForm({ id: taskId }));

    expect(result).toEqual({ error: null });
    expect(fake.calls.map((call) => call.method)).toContain("delete");
    expect(fake.calls).toContainEqual({ method: "eq", args: ["id", taskId] });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("id がないと、DB を呼ばずにエラーを返す", async () => {
    const result = await deleteTask(initialState, new FormData());

    expect(result).toEqual({ error: "対象のタスクが指定されていません" });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("DB がエラーを返すと、削除失敗のエラーを返し画面を更新しない", async () => {
    const fake = createFakeSupabase({ data: null, error: { message: "boom" } });
    createClientMock.mockResolvedValue(fake.client);

    const result = await deleteTask(initialState, buildForm({ id: taskId }));

    expect(result).toEqual({ error: "タスクの削除に失敗しました" });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
