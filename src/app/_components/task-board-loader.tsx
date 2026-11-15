import { AlertCircleIcon } from "lucide-react";
import { createTask, deleteTask, updateTask } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTasks } from "@/lib/tasks/queries";
import { KanbanBoard } from "./kanban-board";

/** タスクを取得してカンバンを描画する。リクエスト時に実行されるため <Suspense> 内で使う。 */
export async function TaskBoardLoader() {
  const result = await getTasks();
  if (!result.ok) {
    console.error("タスクの取得に失敗しました:", result.reason);
    return (
      <Alert variant="destructive">
        <AlertCircleIcon aria-hidden="true" />
        <AlertTitle>タスクを読み込めませんでした。</AlertTitle>
        <AlertDescription>時間をおいて再読み込みしてください。</AlertDescription>
      </Alert>
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
