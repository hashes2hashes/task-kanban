import { Suspense } from "react";
import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";
import { signIn } from "@/app/auth/actions";
import { AuthCard } from "@/app/auth/_components/auth-card";
import { CredentialsForm } from "@/app/auth/_components/credentials-form";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="ログイン"
      description="メールアドレスとパスワードを入力してください。"
      footer={
        <p>
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            新規登録
          </Link>
        </p>
      }
    >
      <div className="flex flex-col gap-4">
        {/* searchParams はリクエスト時の値なので <Suspense> 内で読む。 */}
        <Suspense>
          <ConfirmErrorNotice searchParams={searchParams} />
        </Suspense>
        <CredentialsForm
          action={signIn}
          submitLabel="ログイン"
          pendingLabel="ログイン中…"
          passwordAutoComplete="current-password"
        />
        <p className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            パスワードをお忘れの方
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}

/** 確認メール・再設定メールのリンクが無効・期限切れだった場合（/auth/confirm から戻された場合）の案内。 */
async function ConfirmErrorNotice({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;
  if (error !== "confirm") return null;
  return (
    <Alert variant="destructive">
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle>
        メールのリンクを確認できませんでした。新規登録の確認なら、確認済みの場合はログインしてください。パスワードの再設定なら、リンクを開くブラウザで、もう一度再設定を申請してください。
      </AlertTitle>
    </Alert>
  );
}
