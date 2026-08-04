export type Role = 'Agent' | 'Manager';

export type TicketStatus = 'New' | 'In Progress' | 'Resolved';

export interface User {
  id: number;
  name: string;
  role: Role;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  assignedAgentId: number | null;
  assignedAgent: string | null; // Agent name
  createdBy: number;
  createdByName: string | null;  // Creator name
  createdAt: string;             // ISO datetime
  updatedAt: string;             // ISO datetime
}

export interface TicketHistory {
  id: number;
  ticketId: number;
  changedBy: string;             // User name
  changedById: number;           // User ID
  oldStatus: TicketStatus | null;
  newStatus: TicketStatus;
  timestamp: string;             // ISO datetime
}

export interface AISummary {
  summary: string;
  suggested_tags: string[];
  sentiment: string;
  suggested_reply: string;
}
