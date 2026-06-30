"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="dc-modal-backdrop" onClick={onClose}>
      <div className="dc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" title="Close" style={{ marginLeft: "auto", padding: 6, minHeight: 0 }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 13 }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </label>
  );
}
