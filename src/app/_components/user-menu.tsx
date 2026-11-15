import { CircleUserIcon, LogOutIcon } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { getSignedInUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** ログイン中のメールアドレスとログアウトボタン。Cookie を読むため <Suspense> 内で使う。 */
export async function UserMenu() {
  const supabase = await createClient();
  const user = await getSignedInUser(supabase);
  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <CircleUserIcon className="size-4" aria-hidden="true" />
        {user.email}
      </span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
          <LogOutIcon aria-hidden="true" />
          ログアウト
        </Button>
      </form>
    </div>
  );
}
