"use client";

import { use } from "react";
import Link from "next/link";
import TaskWorkspace from "@/components/TaskWorkspace";
import { personNameFromSlug } from "@/lib/person";

export default function PersonPage({
  params,
}: {
  params: Promise<{ teamId: string; name: string }>;
}) {
  const { teamId, name } = use(params);
  const assignee = personNameFromSlug(name);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <Link
            href={`/team/${teamId}`}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← チーム全体に戻る
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {assignee ?? "未割り当て"}のタスク
          </h1>
        </header>

        <TaskWorkspace teamId={teamId} assignee={assignee} />
      </main>
    </div>
  );
}
