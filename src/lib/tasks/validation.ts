import {
  descriptionMaxLength,
  isTaskStatus,
  titleMaxLength,
  type TaskStatus,
} from "./types";

export type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
};

export type ParseResult =
  | { ok: true; data: TaskInput }
  | { ok: false; error: string };

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** フォーム入力からタスクの値を取り出し、検証する。 */
// DB の char_length と同じく、サロゲートペアを 1 文字として数える。
function countChars(text: string): number {
  return [...text].length;
}

export function parseTaskForm(formData: FormData): ParseResult {
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const status = formData.get("status") ?? "todo";

  if (title.length === 0) {
    return { ok: false, error: "タイトルを入力してください" };
  }
  if (countChars(title) > titleMaxLength) {
    return {
      ok: false,
      error: `タイトルは ${titleMaxLength} 文字以内で入力してください`,
    };
  }
  if (countChars(description) > descriptionMaxLength) {
    return {
      ok: false,
      error: `説明は ${descriptionMaxLength} 文字以内で入力してください`,
    };
  }
  if (!isTaskStatus(status)) {
    return { ok: false, error: "ステータスが不正です" };
  }

  return { ok: true, data: { title, description, status } };
}
