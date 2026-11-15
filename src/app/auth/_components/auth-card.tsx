import type { ReactNode } from "react";
import { KanbanSquareIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

/** ログイン・新規登録画面の共通の枠（中央寄せのカード）。 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4 py-10 font-sans text-foreground">
      <main className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KanbanSquareIcon className="size-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight">タスクカンバン</span>
        </div>
        <Card className="w-full">
          <CardHeader>
            <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            {footer}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
