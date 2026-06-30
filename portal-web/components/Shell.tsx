"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  Activity, BarChart3, Boxes, ChevronLeft, ChevronRight, Clock, FileText, FolderKanban, Gauge,
  GitPullRequestArrow, KeyRound, ListPlus, Menu, Rocket, Search, Settings, Shield, ShieldCheck, Terminal, Users, Wand2, X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const AI_PURPLE = "#8B5CF6";
const ADMIN_INDIGO = "#6366F1";
const BRAND = "#00D97E";
const STORAGE_KEY = "devcloud_sidebar_collapsed";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    setHydrated(true);
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  const effectiveCollapsed = isMobile ? false : collapsed;
  const width = effectiveCollapsed ? 64 : 240;

  function renderGroup(label: string, items: readonly NavItem[], accent: string, badge?: boolean) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {effectiveCollapsed ? (
          <div style={{ height: 1, background: "var(--border)", margin: "10px 12px 6px" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px 6px", fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "var(--text-muted)" }}>
            {label}
            {badge ? <span style={{ fontSize: 9, fontWeight: 800, color: accent, background: `${accent}1f`, border: `1px solid ${accent}55`, borderRadius: 5, padding: "0px 4px" }}>AI</span> : null}
          </div>
        )}
        {items.map(([href, Icon, text]) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href as Route}
              title={effectiveCollapsed ? text : undefined}
              aria-label={text}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: effectiveCollapsed ? "10px 0" : "10px 16px",
                minHeight: 44,
                justifyContent: effectiveCollapsed ? "center" : "flex-start",
                margin: "0 8px",
                borderRadius: 8,
                color: active ? "#ffffff" : "var(--text-secondary)",
                background: active ? `linear-gradient(90deg, ${accent}33, ${accent}0d)` : "transparent",
                borderLeft: active ? `3px solid ${accent}` : "3px solid transparent",
                transition: "background 160ms cubic-bezier(0.16,1,0.3,1), color 160ms",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={20} color={active ? accent : undefined} style={{ flexShrink: 0 }} />
              {!effectiveCollapsed ? <span style={{ fontSize: 14 }}>{text}</span> : null}
            </Link>
          );
        })}
      </div>
    );
  }

  const sidebar = (
    <aside style={{
      borderRight: "1px solid var(--border)", background: "var(--bg-surface)", padding: "10px 0",
      display: "flex", flexDirection: "column", gap: 2, overflowY: "auto", overflowX: "hidden",
      ...(isMobile ? { position: "fixed", top: 0, left: 0, bottom: 0, width: 260, zIndex: 1001, transform: mobileOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 220ms cubic-bezier(0.16,1,0.3,1)", boxShadow: mobileOpen ? "8px 0 40px rgba(0,0,0,0.6)" : "none" } : {})
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: effectiveCollapsed ? "center" : "space-between", padding: effectiveCollapsed ? "6px 0 10px" : "6px 16px 10px", gap: 8 }}>
        {!effectiveCollapsed ? <span className="grad-text" style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>DevCloud</span> : <span style={{ color: "var(--gold)", fontWeight: 800, fontSize: 16 }}>DC</span>}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} title="Close menu" aria-label="Close menu" style={{ padding: 4, minHeight: 0, background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-secondary)" }}><X size={16} /></button>
        ) : hydrated ? (
          <button onClick={toggle} title={collapsed ? "Expand" : "Collapse"} aria-label="Toggle sidebar" style={{ padding: 4, minHeight: 0, display: "grid", placeItems: "center", background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 6, color: "var(--text-secondary)", position: collapsed ? "absolute" : "static", top: collapsed ? 8 : undefined, right: collapsed ? 8 : undefined }}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        ) : null}
      </div>

      {renderGroup("MAIN", MAIN, BRAND)}
      {renderGroup("AI TOOLS", AI_TOOLS, AI_PURPLE, true)}
      {renderGroup("ADMIN", ADMIN, ADMIN_INDIGO)}
    </aside>
  );

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: isMobile ? "1fr" : `${width}px 1fr`, background: "var(--bg-base)", transition: "grid-template-columns 180ms cubic-bezier(0.16,1,0.3,1)" }}>
      {isMobile ? (
        <>
          {mobileOpen ? <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000 }} /> : null}
          {sidebar}
        </>
      ) : sidebar}

      <div style={{ minWidth: 0 }}>
        <header style={{ height: 56, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, padding: "0 16px", background: "var(--bg-surface)", position: "sticky", top: 0, zIndex: 50 }}>
          {isMobile ? (
            <button onClick={() => setMobileOpen(true)} title="Menu" aria-label="Open menu" style={{ padding: 7, minHeight: 0, background: "transparent", border: "1px solid var(--border-strong)", borderRadius: 8, color: "var(--text-primary)" }}><Menu size={18} /></button>
          ) : <Activity size={17} color="var(--brand)" />}
          <span style={{ color: "var(--text-secondary)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pathname.split("/").filter(Boolean).join(" / ") || "dashboard"}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <CommandPalette />
            {!isMobile ? <Search size={18} color="var(--text-secondary)" /> : null}
            <div style={{ width: 28, height: 28, borderRadius: 14, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)" }} />
          </div>
        </header>
        <main className="page" style={{ padding: isMobile ? 14 : 20 }}>{children}</main>
      </div>
    </div>
  );
}
