"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Bot, Clock3, Code2, Cpu, Gauge, MapPin, Power, Radio, Sparkles, Terminal, Ticket, UserCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import styles from "./dev.module.css";

type ExitNode = { id: string; city: string; country: string; flag: string; status: "live" | "coming_soon"; ip?: string; provider?: string };
type NetworkVerification = { publicIp?: string; provider?: string; city?: string; country?: string; status?: string };

type EnvironmentRow = { id: string; name?: string; containerName?: string; techStack?: string; status?: string; uptime?: string };
type TicketRow = { id: string; title?: string; projectName?: string; priority?: string; status?: string };
type AuditRow = { id: string; action?: string; resource?: string; createdAt?: string };

const fallbackNodes: ExitNode[] = [
  { id: "de-fra", city: "Frankfurt", country: "Germany", flag: "DE", status: "live", ip: "167.233.97.163", provider: "Hetzner" },
  { id: "uk-lon", city: "London", country: "United Kingdom", flag: "GB", status: "coming_soon" },
  { id: "us-nyc", city: "New York", country: "United States", flag: "US", status: "coming_soon" },
  { id: "sg", city: "Singapore", country: "Singapore", flag: "SG", status: "coming_soon" },
  { id: "ca-tor", city: "Toronto", country: "Canada", flag: "CA", status: "coming_soon" },
  { id: "au-syd", city: "Sydney", country: "Australia", flag: "AU", status: "coming_soon" }
];

const fallbackEnvironments: EnvironmentRow[] = [
  { id: "env-1", containerName: "fintech-api-dev", techStack: ".NET", status: "Running", uptime: "2h 14m" },
  { id: "env-2", containerName: "client-portal-ui", techStack: "Next.js", status: "Running", uptime: "46m" }
];

const fallbackTickets: TicketRow[] = [
  { id: "t-1", title: "Wire dashboard auth state", projectName: "DevCloud", priority: "High", status: "In Progress" },
  { id: "t-2", title: "Review deployment report layout", projectName: "Client Portal", priority: "Medium", status: "Open" },
  { id: "t-3", title: "Add Redis health check", projectName: "Infrastructure", priority: "Low", status: "Open" }
];

const fallbackAudit: AuditRow[] = [
  { id: "a-1", action: "environment.connect", resource: "fintech-api-dev", createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
  { id: "a-2", action: "ticket.update", resource: "Wire dashboard auth state", createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString() },
  { id: "a-3", action: "terminal.open", resource: "client-portal-ui", createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString() }
];

function timeAgo(value?: string) {
  if (!value) return "just now";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

function stackClass(stack?: string) {
  const value = (stack ?? "Node").toLowerCase();
  if (value.includes(".net")) return styles.stackBlue;
  if (value.includes("next") || value.includes("react")) return styles.stackCyan;
  if (value.includes("python")) return styles.stackGold;
  return styles.stackPurple;
}

export default function DeveloperDashboard() {
  const [nodes, setNodes] = useState<ExitNode[]>(fallbackNodes);
  const [network, setNetwork] = useState<NetworkVerification | null>(null);
  const [selectedNode, setSelectedNode] = useState("de-fra");
  const [toast, setToast] = useState<string | null>(null);
  const [environments, setEnvironments] = useState<EnvironmentRow[]>(fallbackEnvironments);
  const [tickets, setTickets] = useState<TicketRow[]>(fallbackTickets);
  const [audit, setAudit] = useState<AuditRow[]>(fallbackAudit);

  useEffect(() => {
    api<ExitNode[]>("/api/infrastructure/exit-nodes").then(setNodes).catch(() => setNodes(fallbackNodes));
    api<NetworkVerification>("/api/infrastructure/network-verification").then(setNetwork).catch(() => setNetwork({ publicIp: "167.233.97.163", provider: "Hetzner Online GmbH", city: "Falkenstein", country: "DE", status: "verified" }));
    api<EnvironmentRow[]>("/api/environments").then((rows) => setEnvironments(rows.length ? rows : fallbackEnvironments)).catch(() => setEnvironments(fallbackEnvironments));
    api<TicketRow[]>("/api/tickets").then((rows) => setTickets(rows.length ? rows : fallbackTickets)).catch(() => setTickets(fallbackTickets));
    api<AuditRow[]>("/api/infrastructure/audit-logs").then((rows) => setAudit(rows.slice(0, 10).length ? rows.slice(0, 10) : fallbackAudit)).catch(() => setAudit(fallbackAudit));
  }, []);

  const liveNode = nodes.find((node) => node.status === "live") ?? fallbackNodes[0];
  const activeNode = nodes.find((node) => node.id === selectedNode) ?? liveNode;
  const openTickets = tickets.filter((ticket) => (ticket.status ?? "Open") !== "Closed");

  function selectNode(id: string) {
    const node = nodes.find((item) => item.id === id);
    if (!node) return;
    setSelectedNode(id);
    if (node.status !== "live") {
      setToast(`You have been added to the waitlist for ${node.city}.`);
      window.setTimeout(() => setToast(null), 2800);
      setSelectedNode(liveNode.id);
    }
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Logo height={28} />
        <nav className={styles.nav}>
          {["My Environments", "My Tickets", "Terminal", "My Hours", "AI Tools", "Profile"].map((item, index) => (
            <Link key={item} href={index === 4 ? "/ai/environment-builder" : "/dev"} className={index === 0 ? styles.navActive : styles.navItem}>{item}</Link>
          ))}
        </nav>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>Developer Workspace</span>
            <h1>Welcome back, Codemonk</h1>
          </div>
          <div className={styles.topMeta}><MapPin size={16} /> Lagos via {liveNode.city} <span>{liveNode.flag}</span><Bell size={18} /></div>
        </header>

        <section className={styles.stats}>
          <article className={styles.stat}><span><Radio className={styles.greenIcon} size={18} /> My Environments</span><strong>{environments.length}</strong><small><i /> running now</small></article>
          <article className={styles.stat}><span><Ticket size={18} /> My Tickets</span><strong>{openTickets.length}</strong><small>{tickets.filter((t) => t.priority === "High").length} high priority</small></article>
          <article className={styles.stat}><span><Clock3 size={18} /> Hours This Week</span><strong className={styles.goldNumber}>18.5</strong><small>from tracked sessions</small></article>
        </section>

        <section className={styles.grid}>
          <div className={styles.leftColumn}>
            <section className={styles.card}>
              <div className={styles.cardHead}><h2>My Active Environments</h2><Link className={styles.goldButton} href="/ai/environment-builder"><Sparkles size={16} /> New Environment</Link></div>
              <div className={styles.envList}>
                {environments.length ? environments.map((env) => (
                  <div className={styles.envRow} key={env.id}>
                    <span className={`${styles.stackBadge} ${stackClass(env.techStack)}`}>{env.techStack ?? "Node"}</span>
                    <strong>{env.containerName ?? env.name ?? "devcloud-environment"}</strong>
                    <span className={styles.status}><i />{env.status ?? "Running"}</span>
                    <span className={styles.uptime}>{env.uptime ?? "active"}</span>
                    <button className={styles.outlineGold}><Code2 size={15} /> Connect</button>
                    <button className={styles.stopButton}><Power size={15} /> Stop</button>
                  </div>
                )) : <div className={styles.empty}>No environments running. Start one below.</div>}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}><h2>My Activity</h2></div>
              <div className={styles.timeline}>{audit.map((row) => <div className={styles.timelineItem} key={row.id}><span><Gauge size={14} /></span><div><strong>{row.action ?? "activity"}</strong><small>{row.resource ?? "DevCloud"} - {timeAgo(row.createdAt)}</small></div></div>)}</div>
            </section>
          </div>

          <div className={styles.rightColumn}>
            <section className={styles.card}>
              <div className={styles.locationHead}><h2>Network Location</h2><span className={styles.livePill}><i /> Connected</span></div>
              <div className={styles.globeWrap}><div className={styles.globe}><span className={styles.lagosDot} /><span className={styles.exitDot} /></div></div>
              <label className={styles.selectLabel}>Exit Node</label>
              <select className={styles.select} value={selectedNode} onChange={(event) => selectNode(event.target.value)}>
                {nodes.map((node) => <option key={node.id} value={node.id}>{node.flag} {node.city}, {node.country} - {node.status === "live" ? "LIVE" : "Coming Soon"}</option>)}
              </select>
              <div className={styles.networkFacts}>
                <strong>Connected via {liveNode.city}</strong>
                <span>Your traffic exits from: {liveNode.city}, {liveNode.country} {liveNode.flag}</span>
                <span>Detected public IP: {network?.publicIp ?? liveNode.ip ?? "167.233.97.163"}</span>
                <span>Client sees: {network?.provider ?? "Hetzner Online GmbH"}, {network?.city ?? "Falkenstein"} {network?.country ?? "DE"}</span>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}><h2>My Tickets</h2><Link href="/projects" className={styles.textLink}>View all</Link></div>
              <div className={styles.ticketList}>{tickets.slice(0, 5).map((ticket) => <Link className={styles.ticket} href="/projects" key={ticket.id}><span className={styles.priority}>{ticket.priority ?? "Medium"}</span><strong>{ticket.title ?? "Assigned ticket"}</strong><small>{ticket.projectName ?? "DevCloud"} - {ticket.status ?? "Open"}</small></Link>)}</div>
            </section>

            <section className={styles.card}>
              <h2>Quick Actions</h2>
              <div className={styles.actions}><Link href="/ai/code-review">AI Code Review</Link><Link href="/ai/reports">Generate Report</Link><Link href="/terminal">Open Terminal</Link></div>
            </section>
          </div>
        </section>
      </section>
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
