"use client";

import { useState } from "react";
import { Boxes, Play } from "lucide-react";
import { Card, PulseDot, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/use-poll";

interface LiveContainer { id: string; name: string; image: string; status: string; state: string; ports: string; }
interface LivePayload { containers: LiveContainer[]; checkedAt: string; }

const STACKS = ["dotnet", "node", "python", "java", "react", "flutter", "cpp"];

export default function EnvironmentsPage() {
  const live = usePoll<LivePayload>("/api/environments/live", 30000);
  const [stack, setStack] = useState("dotnet");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function start() {
    setStarting(true); setError(null); setNotice(null);
    try {
      const c = await api<LiveContainer>("/api/environments/live/start", { method: "POST", body: JSON.stringify({ stack }) });
      setNotice(`Started ${c.name} (${c.image})`);
      await live.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  }

  async function stop(name: string) {
    try {
      await api("/api/environments/live/stop", { method: "POST", body: JSON.stringify({ stack: name }) });
      await live.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const containers = live.data?.containers ?? [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Boxes color="var(--brand)" />
        <h1 style={{ marginRight: "auto", margin: 0, fontSize: 22 }}>Environments</h1>
        <select value={stack} onChange={(e) => setStack(e.target.value)} title="Stack">
          {STACKS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={start} disabled={starting} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--brand)", color: "#0b0b0b", fontWeight: 600 }}>
          <Play size={15} /> {starting ? "Starting…" : "Start Environment"}
        </button>
      </header>

      {error ? <p className="error-line">{error}</p> : null}
      {notice ? <p style={{ color: "var(--brand)" }}>{notice}</p> : null}

      <Card>
        <SectionTitle action={live.data ? <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}><PulseDot /> live</span> : null}>
          Running containers on Hetzner
        </SectionTitle>
        {live.loading ? <SkeletonLoader rows={3} /> : live.error ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {live.error.toLowerCase().includes("config") || live.error.includes("503") ? "SSH key (DEVCLOUD_SSH_KEY) is not configured on the server." : live.error}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead><tr><th>Name</th><th>Image</th><th>Status</th><th>Ports</th><th></th></tr></thead>
              <tbody>
                {containers.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.image}</td>
                    <td><span style={{ color: c.state?.toLowerCase() === "running" ? "var(--brand)" : "var(--text-secondary)" }}>{c.status}</span></td>
                    <td className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{c.ports || "—"}</td>
                    <td>{c.state?.toLowerCase() === "running" ? <button style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => stop(c.name)}>Stop</button> : null}</td>
                  </tr>
                ))}
                {containers.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--text-muted)" }}>No containers running.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
