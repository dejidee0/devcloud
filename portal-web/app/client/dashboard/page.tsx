"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Download, LogOut, PlusCircle, Send, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";

type Deployment = { id: string; environment?: string; status?: string; commitMessage?: string; createdAt?: string };
type Ticket = { id: string; title?: string; priority?: string; status?: string; assignedTo?: string };

const fallbackDeployments: Deployment[] = [
  { id: "d1", environment: "Production", status: "Success", commitMessage: "Released client dashboard auth flow", createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "d2", environment: "Staging", status: "Pending", commitMessage: "Testing sprint report export", createdAt: new Date(Date.now() - 1000 * 60 * 260).toISOString() },
  { id: "d3", environment: "Staging", status: "Success", commitMessage: "Updated project metrics cards", createdAt: new Date(Date.now() - 1000 * 60 * 900).toISOString() }
];

const fallbackTickets: Ticket[] = [
  { id: "t1", title: "Approve dashboard copy", priority: "Medium", status: "In Review", assignedTo: "CM" },
  { id: "t2", title: "Add payment export field", priority: "High", status: "In Progress", assignedTo: "IF" },
  { id: "t3", title: "Prepare demo environment", priority: "Low", status: "Open", assignedTo: "DV" }
];

function ago(value?: string) {
  if (!value) return "recently";
  const hours = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 3600000));
  return `${hours}h ago`;
}

function statusColor(status?: string) {
  const value = (status ?? "").toLowerCase();
  if (value.includes("fail")) return "#FF3B30";
  if (value.includes("pend") || value.includes("pause")) return "#F5A623";
  if (value.includes("complete")) return "#0EA5E9";
  return "#00D97E";
}

export default function ClientDashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>(fallbackDeployments);
  const [tickets, setTickets] = useState<Ticket[]>(fallbackTickets);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api<Deployment[]>("/api/deployments").then((rows) => setDeployments(rows.length ? rows : fallbackDeployments)).catch(() => setDeployments(fallbackDeployments));
    api<Ticket[]>("/api/tickets").then((rows) => setTickets(rows.length ? rows : fallbackTickets)).catch(() => setTickets(fallbackTickets));
  }, []);

  function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 2600);
    event.currentTarget.reset();
  }

  const completed = tickets.filter((ticket) => ticket.status === "Closed" || ticket.status === "Done").length;
  const progress = Math.max(35, Math.round((completed / Math.max(tickets.length, 1)) * 100));

  return (
    <main style={styles.page}>
      <nav style={styles.topnav}><Logo height={30} /><strong>Welcome back, Client</strong><Link href="/login" style={styles.logout}><LogOut size={16} /> Logout</Link></nav>

      <section style={styles.hero}>
        <div><span style={styles.kicker}>Active Project</span><h1 style={styles.title}>DevCloud Client Portal</h1><p style={styles.muted}>Codewithmonk Technology - Last updated {ago(deployments[0]?.createdAt)}</p></div>
        <span style={styles.activeBadge}>Active</span>
        <div style={styles.badges}>{["Next.js", ".NET 8", "SQL Server", "Docker"].map((item) => <span key={item}>{item}</span>)}</div>
        <div style={styles.metrics}>{[["Total Commits", "148"], ["Sprints Completed", "6"], ["Open Tickets", String(tickets.length - completed)], ["Hours This Month", "124"]].map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
      </section>

      <section style={styles.twoCol}>
        <article style={styles.card}><h2>Recent Deployments</h2><div style={styles.timeline}>{deployments.map((item) => <div key={item.id} style={styles.deployment}><i style={{ background: statusColor(item.status) }} /><div><strong>{item.environment ?? "Staging"}</strong><p>{item.commitMessage ?? "Deployment completed"}</p><small>{item.status ?? "Success"} - {ago(item.createdAt)}</small></div></div>)}</div><Link href="/client/deployments" style={styles.textLink}>View all deployments</Link></article>
        <article style={styles.card}><h2>Active Sprint</h2><div style={styles.progress}><span style={{ width: `${progress}%` }} /></div><p style={styles.muted}>{completed} tickets completed, {Math.max(tickets.length - completed, 0)} remaining</p><div style={styles.ticketList}>{tickets.slice(0, 5).map((ticket) => <div key={ticket.id} style={styles.ticket}><span style={styles.priority}>{ticket.priority ?? "Medium"}</span><strong>{ticket.title ?? "Client ticket"}</strong><em>{ticket.assignedTo ?? "CM"}</em><small>{ticket.status ?? "Open"}</small></div>)}</div></article>
      </section>

      <section style={styles.card}><h2>Raise a Ticket</h2><form onSubmit={submitTicket} style={styles.form}><input name="title" placeholder="Ticket title" required /><select name="priority"><option>Low</option><option>Medium</option><option>High</option></select><textarea name="description" placeholder="Describe what you need" rows={4} required /><button><Send size={16} /> Submit Ticket</button></form>{submitted ? <p style={styles.success}>Ticket submitted for review.</p> : null}<h3>Your recent tickets</h3><div style={styles.recent}>{tickets.slice(0, 5).map((ticket) => <span key={ticket.id}>{ticket.title} <b>{ticket.status}</b></span>)}</div></section>

      <section style={styles.card}><h2>Sprint Reports</h2><div style={styles.reportList}>{["Sprint 06 Delivery Report", "Infrastructure Readiness Report", "Client Portal QA Summary"].map((report, index) => <div key={report} style={styles.report}><div><strong>{report}</strong><small>June {12 + index * 5}, 2026 - June {17 + index * 5}, 2026</small></div><button style={styles.outline}><Download size={15} /> Download PDF</button></div>)}</div><button style={styles.gold}><Sparkles size={16} /> Request New Report</button></section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#080808", color: "#ededed", padding: 24, display: "grid", gap: 20 },
  topnav: { height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #242424", background: "#0f0f0f", borderRadius: 8, padding: "0 18px" },
  logout: { display: "inline-flex", alignItems: "center", gap: 8, color: "#FFC861", textDecoration: "none", fontWeight: 800 },
  hero: { border: "1px solid rgba(245,166,35,.5)", background: "linear-gradient(135deg, rgba(245,166,35,.13), #0f0f0f 42%)", borderRadius: 8, padding: 24, display: "grid", gap: 18 },
  kicker: { color: "#F5A623", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" },
  title: { margin: "5px 0", fontSize: "clamp(30px,5vw,54px)", letterSpacing: 0 },
  muted: { color: "#a1a1aa", margin: 0 },
  activeBadge: { width: "fit-content", color: "#00D97E", background: "rgba(0,217,126,.1)", border: "1px solid rgba(0,217,126,.35)", borderRadius: 999, padding: "6px 12px", fontWeight: 900 },
  badges: { display: "flex", gap: 8, flexWrap: "wrap" },
  metrics: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 },
  twoCol: { display: "grid", gridTemplateColumns: "1.4fr .9fr", gap: 20 },
  card: { background: "#0f0f0f", border: "1px solid #242424", borderRadius: 8, padding: 20, display: "grid", gap: 14 },
  timeline: { display: "grid", gap: 14 },
  deployment: { display: "grid", gridTemplateColumns: "14px 1fr", gap: 12, alignItems: "start" },
  textLink: { color: "#FFC861", fontWeight: 800, textDecoration: "none" },
  progress: { height: 10, background: "#161616", borderRadius: 999, overflow: "hidden" },
  ticketList: { display: "grid", gap: 10 },
  ticket: { display: "grid", gridTemplateColumns: "80px 1fr 44px 90px", gap: 10, alignItems: "center", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10 },
  priority: { color: "#FFC861", fontWeight: 900 },
  form: { display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 },
  success: { color: "#00D97E", margin: 0 },
  recent: { display: "grid", gap: 8, color: "#c9c9cf" },
  reportList: { display: "grid", gap: 10 },
  report: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 8, padding: 12 },
  outline: { minHeight: 38, borderRadius: 8, border: "1px solid rgba(245,166,35,.4)", color: "#FFC861", background: "rgba(245,166,35,.08)", display: "inline-flex", gap: 8, alignItems: "center", justifyContent: "center", padding: "0 12px", fontWeight: 800 },
  gold: { minHeight: 42, border: 0, borderRadius: 8, background: "linear-gradient(135deg,#F5A623,#FFC861)", color: "#080808", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 14px", fontWeight: 900, width: "fit-content" }
};

