import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { AuthCard } from "@/app/auth/_components/auth-card";
import { CredentialsForm } from "@/app/auth/_components/credentials-form";

export default function SignUpPage() {
  return (
    <AuthCard
      title="新規登録"
      description="登録後に届く確認メールのリンクを開くと、ログインできるようになります。"
      footer={
        <p>
          アカウントをお持ちの方は{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            ログイン
          </Link>
        </p>
      }
    >
      <CredentialsForm
        action={signUp}
        submitLabel="アカウントを作成"
        pendingLabel="作成中…"
        passwordAutoComplete="new-password"
      />
    </AuthCard>
  );
}
