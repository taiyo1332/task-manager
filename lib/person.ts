export const UNASSIGNED_SLUG = "_unassigned";
export const UNASSIGNED_LABEL = "未割り当て";

export function personSlug(assignee: string | null): string {
  return assignee ? encodeURIComponent(assignee) : UNASSIGNED_SLUG;
}

export function personNameFromSlug(slug: string): string | null {
  if (slug === UNASSIGNED_SLUG) return null;
  return decodeURIComponent(slug);
}

export function initials(name: string): string {
  return name.trim().slice(0, 2) || "?";
}

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
