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
import { ActionItem, DeadlineItem } from "./action";
import { SystemSettings, NotificationItem, HistoryItem } from "./core";
import { User } from "./user";

export type { DeadlineItem };

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
