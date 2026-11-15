import type { Tables } from "@/lib/supabase/database.types";

export const taskStatuses = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export type Task = Omit<Tables<"tasks">, "status"> & { status: TaskStatus };

export function isTaskStatus(value: unknown): value is TaskStatus {
  return taskStatuses.some((status) => status === value);
}

export const titleMaxLength = 100;
export const descriptionMaxLength = 1000;
