import { BaseUser, Department } from "./core";

export type DeadlineStatus = "On Track" | "At Risk" | "Overdue" | "Selesai";
export type UrgencyLevel = "Low" | "Medium" | "High" | "Critical";

export interface DeadlineItem {
  id: string;
  requestId: string;
  relatedId?: string;
  taskName: string;
  pic: BaseUser;
  department: Department;
  targetDate: string;
  startDate?: string;
  status: DeadlineStatus;
  urgencyLevel: UrgencyLevel;
  milestone: string;
  nextAction?: string;
  overdueReason?: string;
  pausedAt?: string;
  accumulatedPausedDays?: number;
  isEscalated?: boolean;
  escalatedAt?: string;
  escalatedTo?: string;
  recoveryDate?: string;
  recoveryPlan?: string;
}

export type ActionPriority = "High" | "Medium" | "Low";
export type ActionSource = "Dokumen" | "Jaminan" | "Proses Pengadaan" | "Deadline" | "Sistem" | "SLA/Jatuh Tempo";
export type ActionStatus = "Pending" | "In Progress" | "Done" | "Cancelled" | "Completed";
export type ActionType = "Approval" | "Upload" | "Follow Up" | "Review" | "Eskalasi";

export interface ActionItem {
  id: string;
  requestId?: string;
  referenceId: string;
  title: string;
  source: ActionSource;
  priority: ActionPriority;
  dateAdded: string;
  dueDate: string;
  description: string;
  assignee: BaseUser;
  status: ActionStatus;
  actionType: ActionType;
}
