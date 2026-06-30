"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Activity, BarChart3, Boxes, ChevronLeft, ChevronRight, Clock, FileText, FolderKanban, Gauge,
  GitPullRequestArrow, KeyRound, ListPlus, Rocket, Search, Settings, Shield, ShieldCheck, Terminal, Users, Wand2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TerminalPanel } from "@/components/TerminalPanel";
import { CommandPalette } from "@/components/CommandPalette";

type NavItem = readonly [string, LucideIcon, string];

const MAIN: readonly NavItem[] = [
  ["/dashboard", Gauge, "Dashboard"],
  ["/analytics", BarChart3, "Analytics"],
  ["/projects", FolderKanban, "Projects"],
  ["/team", Users, "Team"],
  ["/environments", Boxes, "Environments"],
  ["/terminal", Terminal, "Terminal"],
  ["/deployments", Rocket, "Deployments"]
];

const AI_TOOLS: readonly NavItem[] = [
  ["/ai/code-review", GitPullRequestArrow, "Code Review"],
  ["/ai/environment-builder", Wand2, "Environment Builder"],
  ["/ai/tickets", ListPlus, "Tickets"],
  ["/ai/security", ShieldCheck, "Security"],
  ["/ai/reports", FileText, "Reports"]
];

const ADMIN: readonly NavItem[] = [
  ["/audit", Shield, "Audit"],
  ["/secrets", KeyRound, "Secrets"],
  ["/time-tracking", Clock, "Time Tracking"],
  ["/settings", Settings, "Settings"]
];

const AI_PURPLE = "#b66bff";
const STORAGE_KEY = "devcloud_sidebar_collapsed";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    setHydrated(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  const width = collapsed ? 64 : 240;

  function renderGroup(label: string, items: readonly NavItem[], accent?: string) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {collapsed ? (
          <div style={{ height: 1, background: "var(--border)", margin: "10px 12px 6px" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px 6px", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "var(--text-muted)" }}>
            {label}
            {accent ? <span style={{ fontSize: 9, fontWeight: 800, color: accent, background: `${accent}1f`, border: `1px solid ${accent}55`, borderRadius: 5, padding: "0px 4px" }}>AI</span> : null}
          </div>
        )}
        {items.map(([href, Icon, text]) => {
          const active = pathname.startsWith(href);
          const activeColor = accent ?? "var(--brand)";
          return (
            <Link
              key={href}
              href={href as Route}
              title={collapsed ? text : undefined}
              aria-label={text}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "10px 0" : "10px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                margin: "0 8px",
                borderRadius: 8,
                color: active ? "#ffffff" : "var(--text-secondary)",
                background: active ? "var(--brand-dim)" : "transparent",
                borderLeft: active ? `3px solid ${activeColor}` : "3px solid transparent",
                transition: "background 160ms cubic-bezier(0.16,1,0.3,1), color 160ms",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={20} color={active ? activeColor : undefined} style={{ flexShrink: 0 }} />
              {!collapsed ? <span style={{ fontSize: 14 }}>{text}</span> : null}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: `${width}px 1fr`, background: "var(--bg-base)", transition: "grid-template-columns 180ms cubic-bezier(0.16,1,0.3,1)" }}>
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--bg-surface)", padding: "10px 0", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: collapsed ? "6px 0 10px" : "6px 16px 10px", gap: 8 }}>
          {!collapsed ? <span style={{ color: "var(--brand)", fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>DevCloud</span> : <span style={{ color: "var(--brand)", fontWeight: 800, fontSize: 16 }}>DC</span>}
          {hydrated ? (
            <button onClick={toggle} title={collapsed ? "Expand" : "Collapse"} aria-label="Toggle sidebar" style={{ padding: 4, display: "grid", placeItems: "center", background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-secondary)", position: collapsed ? "absolute" : "static", top: collapsed ? 8 : undefined, right: collapsed ? 8 : undefined }}>
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          ) : null}
        </div>

        {renderGroup("MAIN", MAIN)}
        {renderGroup("AI TOOLS", AI_TOOLS, AI_PURPLE)}
        {renderGroup("ADMIN", ADMIN)}
      </aside>

      <div style={{ minWidth: 0, paddingBottom: 220 }}>
        <header style={{ height: 56, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16, padding: "0 20px", background: "var(--bg-surface)" }}>
          <Activity size={17} color="var(--brand)" />
          <span style={{ color: "var(--text-secondary)" }}>{pathname.split("/").filter(Boolean).join(" / ") || "dashboard"}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <CommandPalette />
            <Search size={18} color="var(--text-secondary)" />
            <div style={{ width: 28, height: 28, borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }} />
          </div>
        </header>
        <main className="page" style={{ padding: 20 }}>{children}</main>
        <TerminalPanel />
      </div>
    </div>
  );
}
