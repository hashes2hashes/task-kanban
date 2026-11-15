"use client";

import { startTransition, useActionState, useId, useState } from "react";
import {
  AlertCircleIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import type { ActionState } from "@/app/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
    <li>
      <Card
        size="sm"
        className={cn(
          "transition-shadow hover:shadow-md",
          isEditing && "ring-2 ring-ring/50",
        )}
      >
        <CardContent>
          {isEditing ? (
            <TaskEditForm
              task={task}
              updateAction={updateAction}
              onDone={() => setIsEditing(false)}
            />
          ) : (
            <div
              className={cn(
                "flex flex-col gap-2",
                isDeleting && "opacity-50",
              )}
            >
              <div className="flex items-start gap-2">
                <h3 className="min-w-0 flex-1 font-medium leading-snug break-words">
                  {task.title}
                </h3>
                <div className="-mt-1 -mr-1 flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`「${task.title}」を編集`}
                    onClick={() => setIsEditing(true)}
                    disabled={isDeleting}
                    className="text-muted-foreground"
                  >
                    <PencilIcon aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`「${task.title}」を削除`}
                    onClick={() => setIsConfirming(true)}
                    disabled={isDeleting}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    {isDeleting ? (
                      <Loader2Icon className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2Icon aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>
              {task.description && (
                <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
              {isDeleting && (
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  削除中…
                </p>
              )}
              {deleteState.error && (
                <Alert variant="destructive">
                  <AlertCircleIcon aria-hidden="true" />
                  <AlertTitle>{deleteState.error}</AlertTitle>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
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
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={task.id} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={titleId}>タイトル</Label>
        <Input
          id={titleId}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={titleMaxLength}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={descriptionId}>説明</Label>
        <Textarea
          id={descriptionId}
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={descriptionMaxLength}
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={statusId}>ステータス</Label>
        <NativeSelect
          id={statusId}
          name="status"
          value={status}
          onChange={(event) => {
            const { value } = event.target;
            if (isTaskStatus(value)) setStatus(value);
          }}
          className="w-full"
        >
          {taskStatuses.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {taskStatusLabels[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{state.error}</AlertTitle>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
          {isPending ? "保存中…" : "保存"}
        </Button>
      </div>
    </form>
  );
}
