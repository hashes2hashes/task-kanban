import { createClient } from "@/lib/supabase/server";
import { isTaskStatus, type Task } from "./types";

export type GetTasksResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; reason: string };

/**
 * タスクを作成日時の古い順に取得する。
 * DB のエラーは例外にせず結果として返す（呼び出し側で try/catch すると、
 * プリレンダー中断のための cookies() の reject まで握りつぶしてしまうため）。
 */
export async function getTasks(): Promise<GetTasksResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    return { ok: false, reason: error.message };
  }

  const tasks = data.flatMap((row) =>
    isTaskStatus(row.status) ? [{ ...row, status: row.status }] : [],
  );
  return { ok: true, tasks };
}
