"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircleIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import type { AuthAction, AuthActionState } from "@/app/auth/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseEmailForm } from "@/lib/auth/validation";

type ForgotPasswordFormProps = {
  action: AuthAction;
};

const initialState: AuthActionState = { error: null, message: null };

/** パスワード再設定メールの送信先（メールアドレス）を入力するフォーム。 */
export function ForgotPasswordForm({ action }: ForgotPasswordFormProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");

  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    async (prevState, formData) => {
      const parsed = parseEmailForm(formData);
      if (!parsed.ok) return { error: parsed.error, message: null };
      return action(prevState, formData);
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId}>メールアドレス</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-9"
        />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>{state.error}</AlertTitle>
        </Alert>
      )}
      {state.message && (
        <Alert>
          <MailCheckIcon aria-hidden="true" />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={isPending} className="w-full">
        {isPending && <Loader2Icon className="animate-spin" aria-hidden="true" />}
        {isPending ? "送信中…" : "再設定用のメールを送信"}
      </Button>
    </form>
  );
}
