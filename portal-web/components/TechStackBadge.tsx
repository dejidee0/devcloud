import type { TechStack } from "@/types/models";

const colors: Record<TechStack, string> = {
  DotNet: "#8B5CF6",
  NodeJS: "#00D97E",
  Python: "#F5A623",
  Java: "#FF3B30",
  React: "#61DAFB",
  Flutter: "#54C5F8",
  CPP: "#888888"
};

export function TechStackBadge({ stack }: { stack: TechStack }) {
  return <span style={{ color: colors[stack], background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 999, padding: "3px 8px", fontSize: 12 }}>{stack}</span>;
}
