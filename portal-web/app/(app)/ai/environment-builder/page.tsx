"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2 } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { api } from "@/lib/api";
import { createActivityConnection } from "@/lib/signalr";

interface Plan { stack?: string; services?: string[]; dockerCompose?: string; setupCommands?: string[]; }
interface BuildResult { plan: Plan; provision: { provisioned: boolean; directory?: string; output?: string; reason?: string }; usage: { inputTokens: number; outputTokens: number }; }

const PHASES = ["analyzing", "provisioning", "ready"] as const;

export default function EnvironmentBuilderPage() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<BuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ phase: string; message: string } | null>(null);
  const connRef = useRef<ReturnType<typeof createActivityConnection> | null>(null);

  useEffect(() => {
    const conn = createActivityConnection();
    conn.on("provision", (e: { phase: string; message: string }) => setProgress(e));
    conn.start().catch(() => undefined);
    connRef.current = conn;
    return () => { void conn.stop(); };
  }, []);

  async function run() {
    setLoading(true); setError(null); setResult(null); setProgress({ phase: "analyzing", message: "Analyzing requirements…" });
    try {
      const res = await api<BuildResult>("/api/ai/build-environment", {
        method: "POST",
        body: JSON.stringify({ description })
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  const activePhase = progress?.phase ?? "";

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 980 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Wand2 color="#b66bff" />
        <h1 style={{ margin: 0, fontSize: 22 }}>AI Environment Builder</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Describe what you need; Claude provisions it</span>
      </header>

      <Card>
        <div style={{ display: "grid", gap: 10 }}>
          <textarea placeholder="e.g. I need a Django REST API with PostgreSQL and Redis" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ resize: "vertical" }} />
          <button onClick={run} disabled={loading || !description.trim()} style={{ background: "#b66bff", color: "#0b0b0b", fontWeight: 600, justifySelf: "start" }}>
            {loading ? "Building…" : "Build environment"}
          </button>
          {error ? <p className="error-line">{error}</p> : null}
        </div>
      </Card>

      {progress || loading ? (
        <Card>
          <SectionTitle>Progress</SectionTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {PHASES.map((p) => {
              const reached = PHASES.indexOf(p as typeof PHASES[number]) <= PHASES.indexOf((activePhase || "analyzing") as typeof PHASES[number]);
              const done = result || activePhase === "ready";
              return (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: reached ? "var(--text-primary)" : "var(--text-muted)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: reached ? (done ? "var(--brand)" : "#b66bff") : "#333" }} />
                  {labelFor(p)}{activePhase === p && !done ? "…" : ""}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {result ? (
        <Card>
          <SectionTitle>Generated Plan</SectionTitle>
          <div style={{ display: "grid", gap: 14, fontSize: 13 }}>
            <div><span style={{ color: "var(--text-secondary)" }}>Stack: </span><strong>{result.plan.stack ?? "—"}</strong></div>
            <div><span style={{ color: "var(--text-secondary)" }}>Services: </span>{(result.plan.services ?? []).join(", ") || "—"}</div>
            {result.plan.dockerCompose ? (
              <div>
                <div style={{ color: "var(--text-secondary)", marginBottom: 6 }}>docker-compose.yml</div>
                <pre className="mono" style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", borderRadius: 8, padding: 12, fontSize: 11, overflowX: "auto", maxHeight: 300 }}>{result.plan.dockerCompose}</pre>
              </div>
            ) : null}
            {(result.plan.setupCommands ?? []).length ? (
              <div>
                <div style={{ color: "var(--text-secondary)", marginBottom: 6 }}>Setup commands</div>
                <pre className="mono" style={{ background: "#0b0b0b", border: "1px solid #1f1f1f", borderRadius: 8, padding: 12, fontSize: 11 }}>{(result.plan.setupCommands ?? []).join("\n")}</pre>
              </div>
            ) : null}
            <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: 12 }}>
              <span style={{ color: result.provision.provisioned ? "var(--brand)" : "var(--warning)", fontWeight: 600 }}>
                {result.provision.provisioned ? "✓ Provisioned on server" : "Plan only"}
              </span>
              {result.provision.reason ? <span style={{ color: "var(--text-muted)" }}> — {result.provision.reason}</span> : null}
              {result.provision.output ? <pre className="mono" style={{ marginTop: 8, fontSize: 11, color: "var(--text-secondary)" }}>{result.provision.output}</pre> : null}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function labelFor(phase: string) {
  return phase === "analyzing" ? "Analyzing requirements" : phase === "provisioning" ? "Provisioning environment" : "Environment ready";
}
