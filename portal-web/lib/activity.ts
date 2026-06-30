export interface ActivityItem {
  id: string;
  action: string;
  resource: string;
  icon: string;
  title: string;
  detail?: string | null;
  userName?: string | null;
  at: string;
}

/** Raw AuditLog from the DB (used to seed the feed before live events arrive). */
interface RawAuditLog {
  id: string;
  action: string;
  resource: string;
  details?: string | null;
  createdAt: string;
}

export function iconForAction(action: string): string {
  const head = action.split(/[._]/)[0].toLowerCase();
  switch (head) {
    case "user":
    case "login":
    case "auth":
      return "user";
    case "project":
      return "folder-kanban";
    case "ticket":
      return "list-checks";
    case "deployment":
    case "deploy":
      return "rocket";
    case "environment":
    case "env":
      return "boxes";
    case "ai":
      return "sparkles";
    case "security":
    case "scan":
      return "shield";
    case "infrastructure":
    case "lockdown":
      return "lock";
    default:
      return "activity";
  }
}

export function titleForAction(action: string, resource: string): string {
  const map: Record<string, string> = {
    "user.login": "logged in",
    "project.created": "created a project",
    "project.updated": "updated a project",
    "ticket.created": "created a ticket",
    "ticket.updated": "updated a ticket",
    "deployment.triggered": "triggered a deployment",
    "environment.started": "started an environment",
    "environment.stopped": "stopped an environment",
    "ai.review": "ran an AI code review",
    "ai.build-environment": "used the AI environment builder",
    "ai.generate-tickets": "generated tickets with AI",
    "ai.security-scan": "ran an AI security scan",
    "ai.generate-report": "generated a project report",
    "security.scan": "Automated security scan"
  };
  return map[action] ?? `${action} (${resource})`;
}

export function fromAuditLog(log: RawAuditLog): ActivityItem {
  return {
    id: log.id,
    action: log.action,
    resource: log.resource,
    icon: iconForAction(log.action),
    title: titleForAction(log.action, log.resource),
    detail: log.details,
    userName: null,
    at: log.createdAt
  };
}
