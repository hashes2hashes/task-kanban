import { createTask, deleteTask, updateTask } from "@/app/actions";
import { getTasks } from "@/lib/tasks/queries";
import { KanbanBoard } from "./kanban-board";

/** タスクを取得してカンバンを描画する。リクエスト時に実行されるため <Suspense> 内で使う。 */
export async function TaskBoardLoader() {
  const result = await getTasks();
  if (!result.ok) {
    console.error("タスクの取得に失敗しました:", result.reason);
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        タスクを読み込めませんでした。時間をおいて再読み込みしてください。
      </p>
    );
  }

  return (
    <KanbanBoard
      tasks={result.tasks}
      createAction={createTask}
      updateAction={updateTask}
      deleteAction={deleteTask}
    />
  );
}
