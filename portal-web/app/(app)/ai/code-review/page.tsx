"use client";

import { useState } from "react";
import { GitPullRequestArrow } from "lucide-react";
import { Card, SectionTitle, SeverityBadge } from "@/components/ui";
import { api } from "@/lib/api";

interface Issue { severity: string; title: string; detail: string; location?: string; }
interface Suggestion { title: string; detail: string; }
interface ReviewResult {
  review: { issues?: Issue[]; suggestions?: Suggestion[]; securityConcerns?: Issue[] };
  usage: { inputTokens: number; outputTokens: number };
}

export default function CodeReviewPage() {
  const [diff, setDiff] = useState("");
  const [projectPath, setProjectPath] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api<ReviewResult>("/api/ai/review-code", {
        method: "POST",
        body: JSON.stringify({ projectPath: projectPath || null, diff })
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 980 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GitPullRequestArrow color="#b66bff" />
        <h1 style={{ margin: 0, fontSize: 22 }}>AI Code Review</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Paste a git diff and let Claude review it</span>
      </header>

      <Card>
        <div style={{ display: "grid", gap: 10 }}>
          <input placeholder="Project path (optional)" value={projectPath} onChange={(e) => setProjectPath(e.target.value)} />
          <textarea placeholder="Paste your git diff here…" value={diff} onChange={(e) => setDiff(e.target.value)} rows={12} className="mono" style={{ fontSize: 12, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={run} disabled={loading || !diff.trim()} style={{ background: "#b66bff", color: "#0b0b0b", fontWeight: 600 }}>
              {loading ? "Reviewing…" : "Review code"}
            </button>
            {result ? <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{result.usage.inputTokens} in / {result.usage.outputTokens} out tokens</span> : null}
          </div>
          {error ? <p className="error-line">{error}</p> : null}
        </div>
      </Card>

      {result ? (
        <div style={{ display: "grid", gap: 16 }}>
          <FindingGroup title="Issues" items={result.review.issues ?? []} />
          <FindingGroup title="Security Concerns" items={result.review.securityConcerns ?? []} />
          <Card>
            <SectionTitle>Suggestions</SectionTitle>
            {(result.review.suggestions ?? []).length === 0 ? <p style={{ color: "var(--text-muted)" }}>No suggestions.</p> : (
              <div style={{ display: "grid", gap: 10 }}>
                {(result.review.suggestions ?? []).map((s, i) => (
                  <div key={i} style={{ borderLeft: "3px solid var(--brand)", paddingLeft: 12 }}>
                    <strong style={{ fontSize: 14 }}>{s.title}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>{s.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function FindingGroup({ title, items }: { title: string; items: Issue[] }) {
  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      {items.length === 0 ? <p style={{ color: "var(--text-muted)" }}>None found.</p> : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "grid", gap: 4, paddingBottom: 12, borderBottom: "1px solid #161616" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SeverityBadge severity={it.severity} />
                <strong style={{ fontSize: 14 }}>{it.title}</strong>
                {it.location ? <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{it.location}</span> : null}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>{it.detail}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
