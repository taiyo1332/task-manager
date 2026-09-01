"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/types/task";
import type { Team } from "@/types/team";
import type { Member } from "@/types/member";
import { UNASSIGNED_LABEL, colorForName, initials, personSlug } from "@/lib/person";
import CreateTaskForm, { type NewTeamTaskInput } from "@/components/CreateTaskForm";
import AvatarUploadModal from "@/components/AvatarUploadModal";
import MemberDeleteModal from "@/components/MemberDeleteModal";

interface PersonSummary {
  slug: string;
  name: string;
  total: number;
  done: number;
}

function summarizeByAssignee(tasks: Task[]): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  map.set(personSlug(null), { slug: personSlug(null), name: UNASSIGNED_LABEL, total: 0, done: 0 });

  for (const task of tasks) {
    const assignee = task.assignee?.trim() || null;
    const slug = personSlug(assignee);
    const name = assignee ?? UNASSIGNED_LABEL;
    const existing = map.get(slug) ?? { slug, name, total: 0, done: 0 };
    existing.total += 1;
    if (task.status === "完了") existing.done += 1;
    map.set(slug, existing);
  }

  const unassigned = map.get(personSlug(null))!;
  const others = [...map.values()]
    .filter((p) => p.slug !== unassigned.slug)
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));

  return [...others, unassigned];
}

export default function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarTarget, setAvatarTarget] = useState<PersonSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PersonSummary | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function fetchData() {
    setLoading(true);
    const [teamResult, tasksResult, membersResult] = await Promise.all([
      supabase.from("teams").select("*").eq("id", teamId).single(),
      supabase.from("tasks").select("*").eq("team_id", teamId),
      supabase.from("members").select("*").eq("team_id", teamId),
    ]);

    if (teamResult.error) {
      setError(teamResult.error.message);
    } else if (tasksResult.error) {
      setError(tasksResult.error.message);
    } else if (membersResult.error) {
      setError(membersResult.error.message);
    } else {
      setTeam(teamResult.data as Team);
      setTasks(tasksResult.data as Task[]);
      setMembers(membersResult.data as Member[]);
      setError(null);
    }
    setLoading(false);
  }

  async function handleCreateTask(input: NewTeamTaskInput) {
    setSubmitting(true);
    const { error } = await supabase.from("tasks").insert({
      team_id: teamId,
      title: input.title,
      assignee: input.assignee || null,
      due_date: input.due_date || null,
      priority: input.priority,
      status: "未着手",
      is_recurring: input.is_recurring,
      recurrence_type: input.recurrence_type,
      recurrence_weekday: input.recurrence_weekday,
    });

    if (error) {
      setError(error.message);
    } else {
      await fetchData();
    }
    setSubmitting(false);
  }

  function getAvatarUrl(name: string): string | null {
    return members.find((m) => m.name === name)?.avatar_url ?? null;
  }

  async function handleTransferAndDelete(
    personName: string,
    targetAssignee: string | null
  ): Promise<string | null> {
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ assignee: targetAssignee })
      .eq("team_id", teamId)
      .eq("assignee", personName);

    if (updateError) return updateError.message;

    const { error: memberError } = await supabase
      .from("members")
      .delete()
      .eq("team_id", teamId)
      .eq("name", personName);

    if (memberError) return memberError.message;

    await fetchData();
    return null;
  }

  async function handleDeleteMemberAndTasks(personName: string): Promise<string | null> {
    const { error: tasksError } = await supabase
      .from("tasks")
      .delete()
      .eq("team_id", teamId)
      .eq("assignee", personName);

    if (tasksError) return tasksError.message;

    const { error: memberError } = await supabase
      .from("members")
      .delete()
      .eq("team_id", teamId)
      .eq("name", personName);

    if (memberError) return memberError.message;

    await fetchData();
    return null;
  }

  const people = summarizeByAssignee(tasks);
  const assigneeSuggestions = people
    .filter((p) => p.name !== UNASSIGNED_LABEL)
    .map((p) => p.name);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← チーム選択に戻る
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {team?.name ?? "チーム"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            担当者を選んでタスクを確認・編集できます
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            エラー: {error}
          </div>
        )}

        <CreateTaskForm
          assigneeSuggestions={assigneeSuggestions}
          onCreate={handleCreateTask}
          submitting={submitting}
        />

        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            読み込み中...
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {people.map((person) => {
              const avatarUrl = getAvatarUrl(person.name);
              const isUnassigned = person.name === UNASSIGNED_LABEL;
              return (
                <div
                  key={person.slug}
                  className="flex w-36 flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {isUnassigned ? (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-400 text-lg font-semibold text-white">
                      ?
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAvatarTarget(person)}
                      aria-label={`${person.name}のアイコンを変更`}
                      className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-lg font-semibold text-white transition-opacity hover:opacity-80"
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          className={`flex h-full w-full items-center justify-center ${colorForName(person.name)}`}
                        >
                          {initials(person.name)}
                        </span>
                      )}
                    </button>
                  )}
                  <Link
                    href={`/team/${teamId}/person/${person.slug}`}
                    className="flex flex-col items-center gap-1 hover:opacity-80"
                  >
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {person.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {person.total === 0
                        ? "タスクなし"
                        : `${person.done}/${person.total}件完了 (${Math.round(
                            (person.done / person.total) * 100
                          )}%)`}
                    </span>
                  </Link>
                  {!isUnassigned && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(person)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      削除
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {avatarTarget && (
        <AvatarUploadModal
          teamId={teamId}
          personName={avatarTarget.name}
          currentAvatarUrl={getAvatarUrl(avatarTarget.name)}
          onClose={() => setAvatarTarget(null)}
          onUploaded={() => fetchData()}
        />
      )}

      {deleteTarget && (
        <MemberDeleteModal
          personName={deleteTarget.name}
          otherMemberNames={people
            .filter((p) => p.name !== UNASSIGNED_LABEL && p.name !== deleteTarget.name)
            .map((p) => p.name)}
          onClose={() => setDeleteTarget(null)}
          onTransfer={(targetAssignee) =>
            handleTransferAndDelete(deleteTarget.name, targetAssignee)
          }
          onDeleteAll={() => handleDeleteMemberAndTasks(deleteTarget.name)}
        />
      )}
    </div>
  );
}
