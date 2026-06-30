"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Boxes, Clock, FileText, FolderKanban, Gauge, GitPullRequestArrow, KeyRound, ListChecks, ListPlus, Rocket, Search, Settings, Shield, ShieldCheck, Terminal, Users, Wand2 } from "lucide-react";
import { TerminalPanel } from "@/components/TerminalPanel";
import { CommandPalette } from "@/components/CommandPalette";

const nav = [
  ["/dashboard", Gauge, "Dashboard"],
  ["/projects", FolderKanban, "Projects"],
  ["/team", Users, "Team"],
  ["/environments", Boxes, "Environments"],
  ["/terminal", Terminal, "Terminal"],
  ["/deployments", Rocket, "Deployments"],
  ["/audit", Shield, "Audit"],
  ["/secrets", KeyRound, "Secrets"],
  ["/time-tracking", Clock, "Time"],
  ["/settings", Settings, "Settings"]
] as const;

const aiNav = [
  ["/ai/code-review", GitPullRequestArrow, "AI Code Review"],
  ["/ai/environment-builder", Wand2, "AI Environment Builder"],
  ["/ai/tickets", ListPlus, "AI Tickets"],
  ["/ai/security", ShieldCheck, "AI Security"],
  ["/ai/reports", FileText, "AI Reports"]
] as const;

const AI_PURPLE = "#b66bff";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "64px 1fr", background: "var(--bg-base)" }}>
      <aside style={{ borderRight: "1px solid var(--border)", background: "var(--bg-surface)", padding: "10px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div title="DevCloud" style={{ height: 44, display: "grid", placeItems: "center", color: "var(--brand)", fontWeight: 800 }}>DC</div>
        {nav.map(([href, Icon, label]) => (
          <Link key={href} href={href} title={label} aria-label={label} style={{
            height: 44, display: "grid", placeItems: "center", borderRadius: 6,
            color: pathname.startsWith(href) ? "var(--brand)" : "var(--text-secondary)",
            background: pathname.startsWith(href) ? "var(--brand-dim)" : "transparent",
            transition: "background 180ms cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <Icon size={19} />
          </Link>
        ))}

        <div title="AI Tools" style={{ marginTop: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "70%", height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: AI_PURPLE, background: `${AI_PURPLE}1f`, border: `1px solid ${AI_PURPLE}55`, borderRadius: 5, padding: "1px 5px" }}>AI</span>
        </div>

        {aiNav.map(([href, Icon, label]) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} title={label} aria-label={label} style={{
              position: "relative", height: 44, display: "grid", placeItems: "center", borderRadius: 6,
              color: active ? AI_PURPLE : "var(--text-secondary)",
              background: active ? `${AI_PURPLE}1a` : "transparent",
              transition: "background 180ms cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
              <Icon size={19} />
              <span style={{ position: "absolute", top: 7, right: 9, width: 5, height: 5, borderRadius: 999, background: AI_PURPLE }} />
            </Link>
          );
        })}
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
