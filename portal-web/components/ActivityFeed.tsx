"use client";

import { useEffect, useState } from "react";
import { Activity, Boxes, FolderKanban, ListChecks, Lock, Rocket, Shield, Sparkles, User } from "lucide-react";
import { createActivityConnection } from "@/lib/signalr";
import { api } from "@/lib/api";
import { type ActivityItem, fromAuditLog } from "@/lib/activity";
import { relativeTime } from "@/lib/session";

const ICONS: Record<string, typeof Activity> = {
  user: User,
  "folder-kanban": FolderKanban,
  "list-checks": ListChecks,
  rocket: Rocket,
  boxes: Boxes,
  sparkles: Sparkles,
  shield: Shield,
  lock: Lock,
  activity: Activity
};

function Icon({ name }: { name: string }) {
  const Comp = ICONS[name] ?? Activity;
  return <Comp size={16} />;
}

export function ActivityFeed({ limit = 12 }: { limit?: number }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;

    // Seed with recent audit logs (best-effort; may be 403 for non-owners).
    api<Array<{ id: string; action: string; resource: string; details?: string | null; createdAt: string }>>("/api/infrastructure/audit-logs")
      .then((logs) => {
        if (mounted && Array.isArray(logs)) setItems(logs.slice(0, limit).map(fromAuditLog));
      })
      .catch(() => undefined);

    const connection = createActivityConnection();
    connection.on("activity", (event: ActivityItem) => {
      if (!event?.id) return;
      setItems((prev) => [event, ...prev.filter((p) => p.id !== event.id)].slice(0, limit));
    });
    connection.start().catch(() => undefined);

    // Re-render every 20s so relative timestamps stay fresh.
    const interval = setInterval(() => setTick((t) => t + 1), 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
      void connection.stop();
    };
  }, [limit]);

  if (items.length === 0) {
    return <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No activity yet. Actions across DevCloud appear here in real time.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 2 }}>
      {items.map((item) => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: "1px solid #161616" }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: "#161616", color: "var(--brand)", flexShrink: 0 }}>
            <Icon name={item.icon} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.userName ? <strong style={{ fontWeight: 600 }}>{item.userName}</strong> : null}{" "}
              {item.title}
            </div>
            {item.detail ? <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.detail}</div> : null}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", flexShrink: 0 }}>{relativeTime(item.at)}</span>
        </div>
      ))}
    </div>
  );
}
