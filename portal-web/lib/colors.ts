export const PALETTE = {
  gold: "#F5A623",
  green: "#00D97E",
  blue: "#0EA5E9",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#FB923C",
  cyan: "#22D3EE",
  red: "#FF3B30",
  indigo: "#6366F1",
  gray: "#888888"
} as const;

/** Each tech stack maps to one consistent color everywhere in the app. */
export function stackColor(stack: string): string {
  switch (stack) {
    case "DotNet": return PALETTE.blue;
    case "NodeJS": return PALETTE.cyan;
    case "Python": return PALETTE.green;
    case "Java": return PALETTE.orange;
    case "React": return PALETTE.cyan;
    case "Flutter": return PALETTE.blue;
    case "CPP": return PALETTE.indigo;
    default: return PALETTE.gray;
  }
}

/** Semantic status colors used by status badges across the app. */
export function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (["running", "success", "active", "completed", "up"].some((k) => s.includes(k))) return PALETTE.green;
  if (["pending", "building", "queued", "review", "snapshotted"].some((k) => s.includes(k))) return PALETTE.orange;
  if (["failed", "critical", "error", "exited", "danger"].some((k) => s.includes(k))) return PALETTE.red;
  if (["stopped", "inactive", "paused", "archived"].some((k) => s.includes(k))) return PALETTE.gray;
  return PALETTE.gray;
}

const AVATAR_HUES = [PALETTE.green, PALETTE.blue, PALETTE.purple, PALETTE.gold, PALETTE.pink, PALETTE.cyan, PALETTE.orange, PALETTE.indigo];

/** Deterministic per-user avatar color from a hash of name/email. */
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[hash % AVATAR_HUES.length];
}
