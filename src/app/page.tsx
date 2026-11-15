import { Suspense } from "react";
import { KanbanSquareIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskBoardLoader } from "./_components/task-board-loader";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-background font-sans text-foreground">
      <main className="flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KanbanSquareIcon className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-semibold tracking-tight">タスクカンバン</h1>
            <p className="text-sm text-muted-foreground">
              タスクを追加して、ステータスごとに進み具合を管理しましょう。
            </p>
          </div>
        </header>
        <Suspense fallback={<BoardSkeleton />}>
          <TaskBoardLoader />
        </Suspense>
      </main>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <p className="sr-only">読み込み中…</p>
      <Skeleton className="h-[106px] rounded-xl sm:h-[66px]" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((column) => (
          <div key={column} className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
