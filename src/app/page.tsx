import { Suspense } from "react";
import { TaskBoardLoader } from "./_components/task-board-loader";

export default function Home() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">タスクカンバン</h1>
        <Suspense fallback={<p className="text-sm text-zinc-500">読み込み中…</p>}>
          <TaskBoardLoader />
        </Suspense>
      </main>
    </div>
  );
}
