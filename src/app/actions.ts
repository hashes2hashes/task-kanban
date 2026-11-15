"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseTaskForm } from "@/lib/tasks/validation";

export type ActionState = { error: string | null };

function readId(formData: FormData): string | null {
  const id = formData.get("id");
  return typeof id === "string" && id.length > 0 ? id : null;
}

const missingIdError: ActionState = { error: "対象のタスクが指定されていません" };

export async function createTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseTaskForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert(parsed.data);
  if (error) {
    console.error("タスクの追加に失敗しました:", error.message);
    return { error: "タスクの追加に失敗しました" };
  }

  refresh();
  return { error: null };
}

export async function updateTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);
  if (!id) return missingIdError;
  const parsed = parseTaskForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("タスクの更新に失敗しました:", error.message);
    return { error: "タスクの更新に失敗しました" };
  }

  // 一覧を最新化して、消えたタスクを画面からも消す。
  refresh();
  if (data.length === 0) {
    return { error: "タスクが見つかりません。削除された可能性があります" };
  }
  return { error: null };
}

export async function deleteTask(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = readId(formData);
  if (!id) return missingIdError;

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("タスクの削除に失敗しました:", error.message);
    return { error: "タスクの削除に失敗しました" };
  }

  refresh();
  return { error: null };
}
