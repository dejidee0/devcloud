"use client";

import { useEffect, useState } from "react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return open ? (
    <div role="dialog" style={{ position: "fixed", inset: "12% auto auto 50%", transform: "translateX(-50%)", width: "min(640px, 90vw)", zIndex: 40, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: 12 }}>
      <input autoFocus placeholder="Search projects, tickets, people, deployments" style={{ width: "100%" }} />
    </div>
  ) : null;
}
