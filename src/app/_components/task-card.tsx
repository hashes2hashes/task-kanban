"use client";

import { startTransition, useActionState, useState } from "react";
import type { ActionState } from "@/app/actions";
import {
  descriptionMaxLength,
  isTaskStatus,
  taskStatuses,
  taskStatusLabels,
  titleMaxLength,
  type Task,
} from "@/lib/tasks/types";
import { parseTaskForm } from "@/lib/tasks/validation";
import { ConfirmDialog } from "./confirm-dialog";

export type TaskAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type TaskCardProps = {
  task: Task;
  updateAction: TaskAction;
  deleteAction: TaskAction;
};

const initialState: ActionState = { error: null };

export function TaskCard({ task, updateAction, deleteAction }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [deleteState, dispatchDelete, isDeleting] = useActionState<
    ActionState,
    FormData
  >(deleteAction, initialState);

  const handleConfirmDelete = () => {
    setIsConfirming(false);
    const formData = new FormData();
    formData.set("id", task.id);
    startTransition(() => dispatchDelete(formData));
  };

  return (
    <li className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {isEditing ? (
        <TaskEditForm
          task={task}
          updateAction={updateAction}
          onDone={() => setIsEditing(false)}
        />
      ) : (
        <div className={isDeleting ? "opacity-50" : undefined}>
          <h3 className="font-medium break-words">{task.title}</h3>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-600 dark:text-zinc-400">
              {task.description}
            </p>
          )}
          {deleteState.error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {deleteState.error}
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2 text-sm">
            <button
              type="button"
              aria-label={`「${task.title}」を編集`}
              onClick={() => setIsEditing(true)}
              disabled={isDeleting}
              className="rounded px-2 py-1 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              編集
            </button>
            <button
              type="button"
              aria-label={`「${task.title}」を削除`}
              onClick={() => setIsConfirming(true)}
              disabled={isDeleting}
              className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
            >
              {isDeleting ? "削除中…" : "削除"}
            </button>
          </div>
        </div>
      )}
      {isConfirming && (
        <ConfirmDialog
          title="タスクの削除"
          message={`「${task.title}」を削除しますか？`}
          confirmLabel="削除する"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirming(false)}
        />
      )}
    </li>
  );
}

type TaskEditFormProps = {
  task: Task;
  updateAction: TaskAction;
  onDone: () => void;
};

function TaskEditForm({ task, updateAction, onDone }: TaskEditFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const parsed = parseTaskForm(formData);
      if (!parsed.ok) return { error: parsed.error };
      const result = await updateAction(prevState, formData);
      if (!result.error) onDone();
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 text-sm">
      <input type="hidden" name="id" value={task.id} />
      <label className="flex flex-col gap-1">
        タイトル
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={titleMaxLength}
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </label>
      <label className="flex flex-col gap-1">
        説明
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={descriptionMaxLength}
          rows={3}
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </label>
      <label className="flex flex-col gap-1">
        ステータス
        <select
          name="status"
          value={status}
          onChange={(event) => {
            const { value } = event.target;
            if (isTaskStatus(value)) setStatus(value);
          }}
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800"
        >
          {taskStatuses.map((value) => (
            <option key={value} value={value}>
              {taskStatusLabels[value]}
            </option>
          ))}
        </select>
      </label>
      {state.error && (
        <p role="alert" className="text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded px-2 py-1 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-zinc-900 px-3 py-1 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "保存中…" : "保存"}
        </button>
      </div>
    </form>
  );
}
