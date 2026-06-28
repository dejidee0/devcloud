import type { Ticket, TicketStatus } from "@/types/models";

const columns: TicketStatus[] = ["Backlog", "Todo", "InProgress", "Review", "Done"];

export function KanbanBoard({ tickets }: { tickets: Ticket[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(180px, 1fr))", gap: 12, overflowX: "auto" }}>
      {columns.map((status) => (
        <section key={status} style={{ border: "1px solid var(--border)", borderRadius: 8, minHeight: 280, background: "var(--bg-surface)" }}>
          <h3 style={{ margin: 0, padding: 12, fontSize: 13, borderBottom: "1px solid var(--border)" }}>{status}</h3>
          <div style={{ padding: 10, display: "grid", gap: 8 }}>
            {tickets.filter((t) => t.status === status).map((ticket) => (
              <article key={ticket.id} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, background: "var(--bg-elevated)" }}>
                <strong style={{ fontSize: 13 }}>{ticket.title}</strong>
                <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 12 }}>{ticket.priority}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
