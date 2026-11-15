"use client";

import { useActionState, useId, useState } from "react";
import { AlertCircleIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import type { AuthAction, AuthActionState } from "@/app/auth/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCredentialsForm, passwordMinLength } from "@/lib/auth/validation";

type CredentialsFormProps = {
  action: AuthAction;
  submitLabel: string;
  pendingLabel: string;
  /** ログインは current-password、新規登録は new-password。 */
  passwordAutoComplete: "current-password" | "new-password";
};

const initialState: AuthActionState = { error: null, message: null };

/** メールアドレスとパスワードを入力するフォーム（ログイン・新規登録で共用）。 */
export function CredentialsForm({
  action,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
}: CredentialsFormProps) {
  const emailId = useId();
  const passwordId = useId();
  // 入力は state で保持し、失敗時に内容が消えないようにする。
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    async (prevState, formData) => {
      const parsed = parseCredentialsForm(formData);
      if (!parsed.ok) return { error: parsed.error, message: null };
      const result = await action(prevState, formData);
      // 確認メール送信後など、成功メッセージが返ったらパスワードは残さない。
      if (result.message) setPassword("");
      return result;
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
      <div className="flex flex-col gap-2">
        <Label htmlFor={passwordId}>パスワード</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={`${passwordMinLength} 文字以上`}
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
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
