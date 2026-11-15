"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import type { AuthAction, AuthActionState } from "@/app/auth/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseNewPasswordForm, passwordMinLength } from "@/lib/auth/validation";

type ResetPasswordFormProps = {
  action: AuthAction;
};

const initialState: AuthActionState = { error: null, message: null };

/** 新しいパスワードを確認用と 2 回入力するフォーム。成功時は Server Action がリダイレクトする。 */
export function ResetPasswordForm({ action }: ResetPasswordFormProps) {
  const passwordId = useId();
  const passwordConfirmationId = useId();
  // 入力は state で保持し、失敗時に内容が消えないようにする。
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    async (prevState, formData) => {
      const parsed = parseNewPasswordForm(formData);
      if (!parsed.ok) return { error: parsed.error, message: null };
      return action(prevState, formData);
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId}>新しいパスワード</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`${passwordMinLength} 文字以上`}
          className="h-9"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordConfirmationId}>新しいパスワード（確認用）</Label>
        <Input
          id={passwordConfirmationId}
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          className="h-9"
        />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{state.error}</AlertTitle>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
        {isPending ? "変更中…" : "パスワードを変更"}
      </Button>
    </form>
  );
}
