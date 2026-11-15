import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthCard } from "@/app/auth/_components/auth-card";
import { ForgotPasswordForm } from "@/app/auth/_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="パスワードの再設定"
      description="登録したメールアドレスに、パスワードを再設定するためのリンクを送ります。"
      footer={
        <p>
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            ログインに戻る
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm action={requestPasswordReset} />
    </AuthCard>
  );
}
