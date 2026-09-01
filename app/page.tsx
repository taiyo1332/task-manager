"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Team } from "@/types/team";

const ARCHIVE_TEAM_NAME = "アーカイブ";

export default function Home() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    setLoading(true);
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setTeams(data as Team[]);
      setError(null);
    }
    setLoading(false);
  }

  async function handleCreateTeam(e: FormEvent) {
    e.preventDefault();
    const name = newTeamName.trim();
    if (!name) return;

    setCreating(true);
    const { data, error } = await supabase
      .from("teams")
      .insert({ name })
      .select("*")
      .single();

    if (error) {
      setError(error.message);
      setCreating(false);
      return;
    }

    setCreating(false);
    setShowForm(false);
    setNewTeamName("");
    router.push(`/team/${(data as Team).id}`);
  }

  async function ensureArchiveTeam(): Promise<string | null> {
    const { data: existing, error: findError } = await supabase
      .from("teams")
      .select("id")
      .eq("name", ARCHIVE_TEAM_NAME)
      .maybeSingle();

    if (findError) {
      setError(findError.message);
      return null;
    }
    if (existing) return existing.id;

    const { data: created, error: createError } = await supabase
      .from("teams")
      .insert({ name: ARCHIVE_TEAM_NAME })
      .select("id")
      .single();

    if (createError) {
      setError(createError.message);
      return null;
    }
    return created.id;
  }

  async function handleDeleteTeam(team: Team) {
    const isArchive = team.name === ARCHIVE_TEAM_NAME;
    const confirmMessage = isArchive
      ? `本当に削除しますか?\n\nチーム名: ${team.name}\n\nこのチームは「${ARCHIVE_TEAM_NAME}」チームのため、移動先がなく、所属するタスク・工程はすべて完全に削除されます。この操作は取り消せません。`
      : `本当に削除しますか?\n\nチーム名: ${team.name}\n\n所属するタスクは「${ARCHIVE_TEAM_NAME}」チームに移動されます。`;

    if (!window.confirm(confirmMessage)) return;

    setDeletingTeamId(team.id);
    setError(null);

    if (isArchive) {
      const { error: deleteTasksError } = await supabase
        .from("tasks")
        .delete()
        .eq("team_id", team.id);

      if (deleteTasksError) {
        setError(deleteTasksError.message);
        setDeletingTeamId(null);
        return;
      }
    } else {
      const archiveTeamId = await ensureArchiveTeam();
      if (!archiveTeamId) {
        setDeletingTeamId(null);
        return;
      }

      const { error: moveError } = await supabase
        .from("tasks")
        .update({ team_id: archiveTeamId })
        .eq("team_id", team.id);

      if (moveError) {
        setError(moveError.message);
        setDeletingTeamId(null);
        return;
      }
    }

    const { error: deleteTeamError } = await supabase.from("teams").delete().eq("id", team.id);
    if (deleteTeamError) {
      setError(deleteTeamError.message);
      setDeletingTeamId(null);
      return;
    }

    await fetchTeams();
    setDeletingTeamId(null);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            チームを選択
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            所属するチームを選ぶか、新しいチームを作成してください
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            エラー: {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            読み込み中...
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {teams.map((team) => (
              <li key={team.id} className="flex items-center gap-2">
                <Link
                  href={`/team/${team.id}`}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
                >
                  {team.name}
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteTeam(team)}
                  disabled={deletingTeamId === team.id}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {deletingTeamId === team.id ? "削除中..." : "削除"}
                </button>
              </li>
            ))}
            {teams.length === 0 && (
              <li className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                チームがまだありません。作成してください。
              </li>
            )}
          </ul>
        )}

        {showForm ? (
          <form
            onSubmit={handleCreateTeam}
            className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input
              type="text"
              placeholder="チーム名"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              autoFocus
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {creating ? "作成中..." : "作成"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            + 新しいチームを作成
          </button>
        )}
      </main>
    </div>
  );
}
