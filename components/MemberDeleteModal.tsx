"use client";

import { useState } from "react";

const UNASSIGNED_OPTION = "__unassigned__";

export default function MemberDeleteModal({
  personName,
  otherMemberNames,
  onClose,
  onTransfer,
  onDeleteAll,
}: {
  personName: string;
  otherMemberNames: string[];
  onClose: () => void;
  onTransfer: (targetAssignee: string | null) => Promise<string | null>;
  onDeleteAll: () => Promise<string | null>;
}) {
  const [transferTarget, setTransferTarget] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTransfer() {
    if (!transferTarget) {
      setError("引き継ぎ先を選択してください");
      return;
    }
    setProcessing(true);
    setError(null);
    const errMsg = await onTransfer(
      transferTarget === UNASSIGNED_OPTION ? null : transferTarget
    );
    setProcessing(false);
    if (errMsg) {
      setError(errMsg);
    } else {
      onClose();
    }
  }

  async function handleDeleteAll() {
    setProcessing(true);
    setError(null);
    const errMsg = await onDeleteAll();
    setProcessing(false);
    if (errMsg) {
      setError(errMsg);
    } else {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {personName}を削除
        </h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          削除方法を選択してください。
        </p>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {otherMemberNames.length > 0 && (
          <section className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              1. タスクを他の人に引き継ぐ
            </h3>
            <div className="flex gap-2">
              <select
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">引き継ぎ先を選択...</option>
                {otherMemberNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value={UNASSIGNED_OPTION}>未割り当てにする</option>
              </select>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={processing || !transferTarget}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
              >
                引き継いで削除
              </button>
            </div>
          </section>
        )}

        <section className="mb-4 rounded-lg border border-red-200 p-4 dark:border-red-900">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {otherMemberNames.length > 0 ? "2. タスクごと削除する" : "タスクごと削除する"}
          </h3>
          <p className="mb-3 text-xs text-red-600 dark:text-red-400">
            このメンバーのタスクと工程がすべて削除されます。元に戻せません。
          </p>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={processing}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            タスクごと削除する
          </button>
        </section>

        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
