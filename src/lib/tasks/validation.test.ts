import { describe, expect, it } from "vitest";
import { parseTaskForm } from "./validation";

function buildForm(fields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("parseTaskForm", () => {
  it("タイトル・説明・ステータスが正しいと、その値を返す", () => {
    const result = parseTaskForm(
      buildForm({ title: "買い物", description: "牛乳", status: "in_progress" }),
    );

    expect(result).toEqual({
      ok: true,
      data: { title: "買い物", description: "牛乳", status: "in_progress" },
    });
  });

  it("説明とステータスが未指定だと、説明は空文字・ステータスは todo になる", () => {
    const result = parseTaskForm(buildForm({ title: "買い物" }));

    expect(result).toEqual({
      ok: true,
      data: { title: "買い物", description: "", status: "todo" },
    });
  });

  it("タイトルと説明の前後の空白は取り除かれる", () => {
    const result = parseTaskForm(
      buildForm({ title: "  買い物  ", description: "  牛乳 \n" }),
    );

    expect(result).toEqual({
      ok: true,
      data: { title: "買い物", description: "牛乳", status: "todo" },
    });
  });

  it("タイトルが空だと、入力を求めるエラーを返す", () => {
    expect(parseTaskForm(buildForm({ title: "" }))).toEqual({
      ok: false,
      error: "タイトルを入力してください",
    });
  });

  it("タイトルが空白のみだと、入力を求めるエラーを返す", () => {
    expect(parseTaskForm(buildForm({ title: "   " }))).toEqual({
      ok: false,
      error: "タイトルを入力してください",
    });
  });

  it("タイトルの項目自体がないと、入力を求めるエラーを返す", () => {
    expect(parseTaskForm(new FormData())).toEqual({
      ok: false,
      error: "タイトルを入力してください",
    });
  });

  it("タイトルがちょうど 100 文字だと、受け付ける", () => {
    const title = "あ".repeat(100);

    expect(parseTaskForm(buildForm({ title }))).toMatchObject({
      ok: true,
      data: { title },
    });
  });

  it("絵文字はサロゲートペアでも 1 文字として数え、100 個なら受け付ける", () => {
    const title = "😀".repeat(100);

    expect(parseTaskForm(buildForm({ title }))).toMatchObject({ ok: true });
  });

  it("タイトルが 101 文字だと、文字数超過のエラーを返す", () => {
    expect(parseTaskForm(buildForm({ title: "あ".repeat(101) }))).toEqual({
      ok: false,
      error: "タイトルは 100 文字以内で入力してください",
    });
  });

  it("説明がちょうど 1000 文字だと、受け付ける", () => {
    const description = "a".repeat(1000);

    expect(
      parseTaskForm(buildForm({ title: "買い物", description })),
    ).toMatchObject({ ok: true, data: { description } });
  });

  it("説明が 1001 文字だと、文字数超過のエラーを返す", () => {
    expect(
      parseTaskForm(buildForm({ title: "買い物", description: "a".repeat(1001) })),
    ).toEqual({
      ok: false,
      error: "説明は 1000 文字以内で入力してください",
    });
  });

  it("ステータスが定義外の値だと、不正なステータスのエラーを返す", () => {
    expect(
      parseTaskForm(buildForm({ title: "買い物", status: "archived" })),
    ).toEqual({ ok: false, error: "ステータスが不正です" });
  });
});
