import type { Task } from "@/types/task";
import { isOverdue } from "@/lib/priority";

export default function ProgressSummary({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "完了").length;
  const inProgress = tasks.filter((t) => t.status === "進行中").length;
  const notStarted = tasks.filter((t) => t.status === "未着手").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const donePercent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            全体の進捗
          </h2>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {donePercent}%
            <span className="ml-2 text-base font-normal text-zinc-400">
              ({done}/{total} 完了)
            </span>
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Stat label="未着手" value={notStarted} dotClass="bg-zinc-400" />
          <Stat label="進行中" value={inProgress} dotClass="bg-blue-500" />
          <Stat label="完了" value={done} dotClass="bg-green-500" />
          {overdue > 0 && (
            <Stat label="期限超過" value={overdue} dotClass="bg-red-500" />
          )}
        </div>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${donePercent}%` }}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
