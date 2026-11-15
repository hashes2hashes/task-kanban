"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/app/actions";
import { descriptionMaxLength, titleMaxLength } from "@/lib/tasks/types";
import { parseTaskForm } from "@/lib/tasks/validation";
import type { TaskAction } from "./task-card";

type TaskCreateFormProps = {
  createAction: TaskAction;
};

const initialState: ActionState = { error: null };

export function TaskCreateForm({ createAction }: TaskCreateFormProps) {
  // 入力は state で保持し、失敗時に内容が消えないようにする。
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const parsed = parseTaskForm(formData);
      if (!parsed.ok) return { error: parsed.error };
      const result = await createAction(prevState, formData);
      if (!result.error) {
        setTitle("");
        setDescription("");
      }
      return result;
    },
    initialState,
  );

  return (
    <form
      action={formAction}
      aria-label="タスクの追加"
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm sm:flex-row sm:items-end dark:border-zinc-700 dark:bg-zinc-900"
    >
      <label className="flex flex-1 flex-col gap-1">
        タイトル
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={titleMaxLength}
          placeholder="例: 企画書を書く"
          className="rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </label>
      <label className="flex flex-[2] flex-col gap-1">
        説明
        <input
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={descriptionMaxLength}
          placeholder="任意"
          className="rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-zinc-900 px-4 py-1.5 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending ? "追加中…" : "追加"}
      </button>
      {state.error && (
        <p role="alert" className="text-red-600 sm:basis-full">
          {state.error}
        </p>
      )}
    </form>
  );
}
