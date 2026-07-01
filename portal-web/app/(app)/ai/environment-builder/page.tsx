"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, Copy, Play, RotateCcw, Sparkles, Terminal } from "lucide-react";

type Step = "describe" | "spec" | "build" | "ready";
type Spec = { stacks: string[]; services: string[]; estimatedSeconds: number; projectSlug: string; ports: string[] };

const templates = [
  ["Full Stack .NET + Next.js", "A Next.js dashboard with .NET 8 API, SQL Server, and Redis for a fintech client"],
  ["Django REST API", "A Django REST API with PostgreSQL, Redis, Celery workers, and OpenAPI docs"],
  ["Node.js Microservice", "A Node.js microservice with Express, PostgreSQL, Redis cache, and Docker health checks"],
  ["Flutter Mobile Backend", "A Flutter mobile backend with .NET 8 APIs, SQL Server, push notification workers, and Redis"],
  ["React SPA + Node API", "A React SPA with a Node.js API, PostgreSQL database, and background queue workers"]
] as const;

const buildLines = [
  "Analyzing requirements...",
  "OK Stack identified: .NET 8 + Next.js + SQL Server + Redis",
  "Pulling .NET 8 runtime image...",
  "OK Runtime ready",
  "Pulling Next.js environment...",
  "OK Next.js environment ready",
  "Configuring SQL Server connection...",
  "OK Database configured",
  "Starting Redis cache...",
  "OK Redis running on port 6379",
  "Wiring environment variables...",
  "OK Environment variables configured",
  "Running health checks...",
  "OK All services healthy",
  "==============================",
  "OK ENVIRONMENT READY",
  "=============================="
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32) || "devcloud-build";
}

function inferSpec(description: string): Spec {
  const lower = description.toLowerCase();
  const stacks = [lower.includes(".net") ? ".NET 8" : "Node.js", lower.includes("next") ? "Next.js 14" : "React", lower.includes("sql") ? "SQL Server" : "PostgreSQL", "Redis"];
  return { stacks, services: ["api", "web", "database", "cache"], estimatedSeconds: 90, projectSlug: slugify(description), ports: ["5000 API", "3000 UI", "1433 DB", "6379 Redis"] };
}

function now(offset: number) {
  const date = new Date(Date.now() + offset * 1000);
  return date.toLocaleTimeString([], { hour12: false });
}

export default function EnvironmentBuilderPage() {
  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState<string>(templates[0][1]);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  const currentSpec = useMemo(() => spec ?? inferSpec(description), [description, spec]);

  function analyze() {
    setStep("spec");
    setSpec(inferSpec(description));
  }

  function build() {
    setStep("build");
    setVisibleLines([]);
    buildLines.forEach((line, index) => {
      window.setTimeout(() => {
        setVisibleLines((current) => [...current, `[${now(index)}] ${line}`]);
        if (index === buildLines.length - 1) window.setTimeout(() => setStep("ready"), 700);
      }, index * 420);
    });
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", color: "#fff", background: "linear-gradient(135deg,#8B5CF6,#5B21B6)" }}><Bot size={24} /></span>
        <div>
          <span style={{ color: "#8B5CF6", fontWeight: 800, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>AI Environment Builder</span>
          <h1 style={{ margin: "4px 0 0" }}>Build a cloud environment from a prompt</h1>
        </div>
      </header>

      {step === "describe" ? (
        <section style={panel({ padding: 24, minHeight: 420, placeItems: "center" })}>
          <div style={{ width: "min(860px,100%)", display: "grid", gap: 18 }}>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what you're building..." style={textarea} rows={7} />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{templates.map(([label, text]) => <button key={label} onClick={() => setDescription(text)} style={chip}>{label}</button>)}</div>
            <button onClick={analyze} style={goldButton}><Sparkles size={18} /> Analyze with AI -&gt;</button>
          </div>
        </section>
      ) : null}

      {step === "spec" ? (
        <section style={panel({ padding: 24 })}>
          <h2>Environment Specification</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={specBox}><strong>Stack detected</strong>{currentSpec.stacks.map((item) => <span key={item}>Blue: {item}</span>)}</div>
            <div style={specBox}><strong>Services</strong>{currentSpec.services.map((item) => <span key={item}>{item}</span>)}</div>
            <div style={specBox}><strong>Estimated spin-up</strong><span>~{currentSpec.estimatedSeconds} seconds</span><span>Ports: {currentSpec.ports.join(", ")}</span></div>
            <div style={specBox}><strong>Project folder</strong><span>/home/devcloud/projects/{currentSpec.projectSlug}</span></div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}><button onClick={() => setStep("describe")} style={ghostButton}>Edit Description</button><button onClick={build} style={goldButton}><Play size={17} /> Build Now -&gt;</button></div>
        </section>
      ) : null}

      {step === "build" ? (
        <section style={panel({ padding: 0 })}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #242424", display: "flex", gap: 8, alignItems: "center" }}><Terminal size={18} color="#F5A623" /><strong>Live build progress</strong></div>
          <pre style={terminal}>{visibleLines.join("\n")}</pre>
        </section>
      ) : null}

      {step === "ready" ? (
        <section style={panel({ padding: 24 })}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", color: "#00D97E" }}><CheckCircle2 /><h2 style={{ margin: 0 }}>Environment Ready</h2></div>
          <h3>{currentSpec.projectSlug}-dev</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={specBox}><strong>Connect via VSCode</strong><span>Host: codemonk-devcloud</span><span>Folder: /home/devcloud/projects/{currentSpec.projectSlug}</span><button style={ghostButton}><Copy size={15} /> Copy SSH Config</button></div>
            <div style={specBox}><strong>Services running</strong>{["API -> localhost:5000", "UI -> localhost:3000", "DB -> localhost:1433", "Redis -> localhost:6379"].map((item) => <span key={item} style={{ color: "#00D97E" }}>? {item}</span>)}</div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 18 }}><Link href="/environments" style={goldButton}>View in Environments</Link><button onClick={() => { setStep("describe"); setVisibleLines([]); }} style={ghostButton}><RotateCcw size={15} /> New Build</button></div>
        </section>
      ) : null}
    </div>
  );
}

function panel(extra: CSSProperties): CSSProperties { return { background: "#0f0f0f", border: "1px solid #242424", borderRadius: 8, boxShadow: "0 20px 70px rgba(0,0,0,.22)", display: "grid", ...extra }; }
const textarea: CSSProperties = { width: "100%", resize: "vertical", background: "#161616", color: "#ededed", border: "1px solid #2a2a2a", borderRadius: 8, padding: 16, fontSize: 16, lineHeight: 1.6, outlineColor: "#8B5CF6" };
const chip: CSSProperties = { minHeight: 36, borderRadius: 999, border: "1px solid rgba(139,92,246,.38)", color: "#c4b5fd", background: "rgba(139,92,246,.11)", padding: "0 13px", fontWeight: 750 };
const goldButton: CSSProperties = { minHeight: 42, width: "fit-content", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, border: 0, borderRadius: 8, background: "linear-gradient(135deg,#F5A623,#FFC861)", color: "#080808", padding: "0 16px", fontWeight: 850, textDecoration: "none" };
const ghostButton: CSSProperties = { minHeight: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1px solid rgba(245,166,35,.4)", borderRadius: 8, color: "#FFC861", background: "rgba(245,166,35,.08)", padding: "0 14px", fontWeight: 800, textDecoration: "none" };
const specBox: CSSProperties = { display: "grid", gap: 8, padding: 14, borderRadius: 8, background: "#161616", border: "1px solid #2a2a2a", color: "#c9c9cf" };
const terminal: CSSProperties = { minHeight: 390, margin: 0, padding: 18, background: "#050505", color: "#00D97E", fontSize: 13, lineHeight: 1.7, overflow: "auto" };


