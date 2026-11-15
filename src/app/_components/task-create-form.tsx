"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircleIcon, Loader2Icon, PlusIcon } from "lucide-react";
import type { ActionState } from "@/app/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { descriptionMaxLength, titleMaxLength } from "@/lib/tasks/types";
import { parseTaskForm } from "@/lib/tasks/validation";
import type { TaskAction } from "./task-card";

type TaskCreateFormProps = {
  createAction: TaskAction;
};

const initialState: ActionState = { error: null };

export function TaskCreateForm({ createAction }: TaskCreateFormProps) {
  const titleId = useId();
  const descriptionId = useId();
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
    <Card>
      <CardContent>
        <form
          action={formAction}
          aria-label="タスクの追加"
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor={titleId}>タイトル</Label>
            <Input
              id={titleId}
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={titleMaxLength}
              placeholder="例: 企画書を書く"
              className="h-9"
            />
          </div>
          <div className="flex flex-[2] flex-col gap-2">
            <Label htmlFor={descriptionId}>説明</Label>
            <Input
              id={descriptionId}
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={descriptionMaxLength}
              placeholder="任意"
              className="h-9"
            />
          </div>
          <Button type="submit" size="lg" disabled={isPending} className="px-4">
            {isPending ? (
              <Loader2Icon className="animate-spin" aria-hidden="true" />
            ) : (
              <PlusIcon aria-hidden="true" />
            )}
            {isPending ? "追加中…" : "追加"}
          </Button>
        </form>
        {state.error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>{state.error}</AlertTitle>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
