export type Role = "Owner" | "CoFounder" | "Developer" | "ProductManager" | "Client";
export type ProjectStatus = "Active" | "Paused" | "Completed" | "Archived";
export type TicketStatus = "Backlog" | "Todo" | "InProgress" | "Review" | "Done";
export type TechStack = "DotNet" | "NodeJS" | "Python" | "Java" | "React" | "Flutter" | "CPP";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientName: string;
  status: ProjectStatus;
  techStack: TechStack;
  createdAt: string;
  ownerId: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignedToId?: string;
  createdById: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: TicketStatus;
  updatedAt: string;
}

export interface DevEnvironment {
  id: string;
  projectId: string;
  userId: string;
  techStack: TechStack;
  containerName: string;
  status: "Running" | "Stopped" | "Snapshotted";
  lastActive?: string;
  snapshotName?: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  environment: "Staging" | "Production";
  status: "Pending" | "Running" | "Success" | "Failed";
  commitHash?: string;
  startedAt: string;
  completedAt?: string;
  logs?: string;
}
