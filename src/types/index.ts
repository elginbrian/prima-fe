export * from "./core";
export * from "./user";
export * from "./procurement";
export * from "./guarantee";
export * from "./action";

import {
  ProcurementRequest,
  DocumentItem,
  ProcurementAttachment,
  ProcurementMilestone,
} from "./procurement";
import { GuaranteeItem } from "./guarantee";
import { ActionItem } from "./action";
import { SystemSettings, NotificationItem, HistoryItem } from "./core";
import { User } from "./user";

export interface DeadlineItem {
  id: string;
  requestId: string;
  relatedId?: string;
  taskName: string;
  milestone: string;
  pic: import("./core").BaseUser;
  department: import("./core").Department;
  startDate?: string;
  targetDate: string;
  status: "On Track" | "At Risk" | "Overdue" | "Selesai";
  urgencyLevel: "Low" | "Medium" | "High" | "Critical";
  nextAction?: string;
  overdueReason?: string;
  pausedAt?: string;
  accumulatedPausedDays?: number;
}

export interface ProcurementState {
  requests: ProcurementRequest[];
  documents: DocumentItem[];
  guarantees: GuaranteeItem[];
  attachments: ProcurementAttachment[];
  actions: ActionItem[];
  notifications: NotificationItem[];
  deadlines: DeadlineItem[];
  history: HistoryItem[];
  milestones: ProcurementMilestone[];
  settings: SystemSettings;
  users: User[];
  currentUser: User;
}
