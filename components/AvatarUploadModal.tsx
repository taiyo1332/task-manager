"use client";

import { useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

export default function AvatarUploadModal({
  teamId,
  personName,
  currentAvatarUrl,
  onClose,
  onUploaded,
}: {
  teamId: string;
  personName: string;
  currentAvatarUrl: string | null;
  onClose: () => void;
  onUploaded: (avatarUrl: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("画像を選択してください");
      return;
    }
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop() || "png";
    const path = `${teamId}/${encodeURIComponent(personName)}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(`アップロードに失敗しました: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = publicUrlData.publicUrl;

    const { data: existing, error: fetchError } = await supabase
      .from("members")
      .select("id")
      .eq("team_id", teamId)
      .eq("name", personName)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setUploading(false);
      return;
    }

    const { error: saveError } = existing
      ? await supabase.from("members").update({ avatar_url: avatarUrl }).eq("id", existing.id)
      : await supabase
          .from("members")
          .insert({ team_id: teamId, name: personName, avatar_url: avatarUrl });

    setUploading(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    onUploaded(avatarUrl);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {personName}のアイコン画像
        </h2>

        <div className="mb-4 flex justify-center">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={personName}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800">
              未設定
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !file}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </div>
    </div>
  );
}
