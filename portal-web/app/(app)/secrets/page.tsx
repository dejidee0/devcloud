"use client";

import { ExternalLink, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { TechStackBadge } from "@/components/TechStackBadge";
import { useApi } from "@/lib/use-api";
import { PALETTE } from "@/lib/colors";
import type { Project } from "@/types/models";

const INFISICAL_URL = "http://100.105.66.71:8080";

export default function SecretsPage() {
  const projects = useApi<Project[]>("/api/projects");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <KeyRound color={PALETTE.gold} />
        <h1 style={{ margin: 0 }}>Secrets</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>Managed with Infisical</span>
      </header>

      <Card accent style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--gold-dim)", color: "var(--gold)", flexShrink: 0 }}><ShieldCheck size={22} /></span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <strong style={{ fontSize: 15 }}>DevCloud uses Infisical for secrets management</strong>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "6px 0 0", lineHeight: 1.6 }}>
            Credentials, API keys, and environment configuration are stored encrypted in a self-hosted Infisical instance — never in code or shared over chat. Open a project to view and manage its secrets.
          </p>
        </div>
        <a href={INFISICAL_URL} target="_blank" rel="noreferrer noopener"><button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}><ExternalLink size={15} /> Open Infisical</button></a>
      </Card>

      <SectionTitle>Projects</SectionTitle>
      {projects.loading ? <SkeletonLoader /> : projects.error ? <p className="error-line">{projects.error}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {(projects.data ?? []).map((p) => (
            <Card key={p.id} style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={15} color="var(--gold)" />
                <strong>{p.name}</strong>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.clientName}</div>
              <TechStackBadge stack={p.techStack} />
              <a href={INFISICAL_URL} target="_blank" rel="noreferrer noopener" style={{ marginTop: 4 }}>
                <button className="btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13 }}><ExternalLink size={14} /> Open in Infisical</button>
              </a>
            </Card>
          ))}
          {(projects.data ?? []).length === 0 ? <p style={{ color: "var(--text-muted)" }}>No projects yet.</p> : null}
        </div>
      )}

      <Card>
        <SectionTitle>Security summary</SectionTitle>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
          Connect an Infisical API key in <span style={{ color: "var(--gold)" }}>Settings</span> to see live secret counts and rotation status here.
        </p>
      </Card>
    </div>
  );
}
