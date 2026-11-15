import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";
import { AuthCard } from "@/app/auth/_components/auth-card";
import { ResetPasswordForm } from "@/app/auth/_components/reset-password-form";

/** 再設定メールのリンク（/auth/confirm）でログインした後に開く画面。未ログインなら Proxy が /login へ戻す。 */
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="新しいパスワードの設定"
      description="新しいパスワードを入力してください。変更後はそのままタスクの画面に移ります。"
      footer={
        <p>
          <Link href="/" className="font-medium text-foreground underline underline-offset-4">
            変更せずにトップへ戻る
          </Link>
        </p>
      }
    >
      <ResetPasswordForm action={updatePassword} />
    </AuthCard>
  );
}
