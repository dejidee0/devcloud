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

  async function restart(name: string) {
    setError(null);
    try {
      await api("/api/environments/live/restart", { method: "POST", body: JSON.stringify({ stack: name }) });
      await live.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const containers = live.data?.containers ?? [];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Boxes color="var(--cyan)" />
        <h1 style={{ marginRight: "auto", margin: 0 }}>Environments</h1>
        <select value={stack} onChange={(e) => setStack(e.target.value)} title="Stack">
          {STACKS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn-primary" onClick={start} disabled={starting} style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            <table className="responsive-table" style={{ width: "100%", fontSize: 13 }}>
              <thead><tr><th>Name</th><th>Image</th><th>Status</th><th>Ports</th><th>Action</th></tr></thead>
              <tbody>
                {containers.map((c) => {
                  const running = c.state?.toLowerCase() === "running";
                  return (
                    <tr key={c.id}>
                      <td data-label="Name" className="mono">{c.name}</td>
                      <td data-label="Image" style={{ color: "var(--text-secondary)" }}>{c.image}</td>
                      <td data-label="Status"><span style={{ color: running ? "var(--green)" : c.state?.toLowerCase() === "exited" ? "var(--red)" : "var(--text-secondary)" }}>{c.status}</span></td>
                      <td data-label="Ports" className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>{c.ports || "—"}</td>
                      <td data-label="Action">
                        {running
                          ? <button onClick={() => stop(c.name)} style={{ fontSize: 12, padding: "5px 12px" }}>Stop</button>
                          : <button onClick={() => restart(c.name)} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "5px 12px", color: "var(--green)", borderColor: "var(--green)" }}><Play size={13} /> Start</button>}
                      </td>
                    </tr>
                  );
                })}
                {containers.length === 0 ? <tr><td colSpan={5} style={{ color: "var(--text-muted)" }}>No containers found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
