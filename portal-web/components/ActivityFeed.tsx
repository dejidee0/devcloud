"use client";

import { useEffect, useState } from "react";
import { createActivityConnection } from "@/lib/signalr";

export function ActivityFeed() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    const connection = createActivityConnection();
    connection.on("activity", (event) => setItems((prev) => [JSON.stringify(event), ...prev].slice(0, 8)));
    connection.start().catch((err) => setItems([`SignalR error: ${err.message}`]));
    return () => {
      void connection.stop();
    };
  }, []);
  return <div style={{ display: "grid", gap: 8 }}>{items.map((item, i) => <code key={i} className="mono" style={{ color: "var(--text-secondary)" }}>{item}</code>)}</div>;
}
