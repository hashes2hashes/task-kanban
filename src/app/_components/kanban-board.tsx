"use client";

import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleIcon,
  InboxIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const statusIcons: Record<TaskStatus, LucideIcon> = {
  todo: CircleIcon,
  in_progress: CircleDashedIcon,
  done: CircleCheckIcon,
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
      <div className="grid items-start gap-4 md:grid-cols-3">
        {taskStatuses.map((status) => {
          const columnTasks = tasksByStatus(status);
          const headingId = `column-${status}`;
          const StatusIcon = statusIcons[status];
          return (
            <section
              key={status}
              aria-labelledby={headingId}
              className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3"
            >
              <header className="flex items-center gap-2 px-1">
                <StatusIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 id={headingId} className="text-sm font-semibold">
                  {taskStatusLabels[status]}
                </h2>
                <Badge variant="secondary" className="ml-auto tabular-nums">
                  {columnTasks.length} 件
                </Badge>
              </header>
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-muted-foreground">
                  <InboxIcon className="size-5" aria-hidden="true" />
                  <p className="text-sm">タスクはありません</p>
                </div>
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
