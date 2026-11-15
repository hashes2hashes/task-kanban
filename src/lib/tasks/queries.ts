import { createClient } from "@/lib/supabase/server";
import { isTaskStatus, type Task } from "./types";

/** タスクを作成日時の古い順に取得する。失敗時はエラーを投げる。 */
export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`タスクの取得に失敗しました: ${error.message}`);
  }

  return data.flatMap((row) =>
    isTaskStatus(row.status) ? [{ ...row, status: row.status }] : [],
  );
}
