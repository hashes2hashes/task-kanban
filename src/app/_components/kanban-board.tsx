"use client";

import {
  taskStatuses,
  taskStatusLabels,
  type Task,
  type TaskStatus,
} from "@/lib/tasks/types";
import { TaskCard, type TaskAction } from "./task-card";
import { TaskCreateForm } from "./task-create-form";

type KanbanBoardProps = {
  tasks: Task[];
  createAction: TaskAction;
  updateAction: TaskAction;
  deleteAction: TaskAction;
};

export function KanbanBoard({
  tasks,
  createAction,
  updateAction,
  deleteAction,
}: KanbanBoardProps) {
  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  return (
    <div className="flex flex-col gap-6">
      <TaskCreateForm createAction={createAction} />
      <div className="grid gap-4 md:grid-cols-3">
        {taskStatuses.map((status) => {
          const columnTasks = tasksByStatus(status);
          const headingId = `column-${status}`;
          return (
            <section
              key={status}
              aria-labelledby={headingId}
              className="flex flex-col gap-3 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800/50"
            >
              <header className="flex items-center justify-between">
                <h2 id={headingId} className="font-semibold">
                  {taskStatusLabels[status]}
                </h2>
                <span className="text-xs text-zinc-500">{columnTasks.length} 件</span>
              </header>
              {columnTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">タスクはありません</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      updateAction={updateAction}
                      deleteAction={deleteAction}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
