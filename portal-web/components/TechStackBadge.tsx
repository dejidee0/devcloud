import type { TechStack } from "@/types/models";
import { stackColor } from "@/lib/colors";

export function TechStackBadge({ stack }: { stack: TechStack }) {
  const color = stackColor(stack);
  return (
    <span style={{ color, background: `${color}1a`, border: `1px solid ${color}40`, borderRadius: 999, padding: "3px 9px", fontSize: 12, fontWeight: 500 }}>
      {stack}
    </span>
  );
}
