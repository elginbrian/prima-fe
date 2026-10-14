import type {
  ProcurementState,
  ProcurementStage,
  ProcurementStep,
  ProcurementRequest,
  ProcurementOperationalStatus,
  DocumentItem,
  GuaranteeItem,
  ProcurementAttachment,
  ActionItem,
  NotificationItem,
  DeadlineItem,
  HistoryItem,
} from "@/types";

export type ProcurementAction =
  | { type: "ADD_REQUEST"; request: ProcurementRequest }
  | { type: "MOVE_REQUEST"; id: string; stage: ProcurementStage }
  | { type: "UPDATE_REQUEST_OPERATIONAL_STATUS"; id: string; status: ProcurementOperationalStatus; reason?: string }
  | { type: "MOVE_REQUEST_STEP"; id: string; step: ProcurementStep }
  | { type: "ADD_DOCUMENT"; document: DocumentItem }
  | { type: "UPDATE_DOCUMENT_STATUS"; id: string; status: DocumentItem["status"] }
  | { type: "ADD_GUARANTEE"; guarantee: GuaranteeItem }
  | { type: "UPDATE_GUARANTEE"; id: string; changes: Partial<GuaranteeItem> }
  | { type: "ADD_ATTACHMENT"; attachment: ProcurementAttachment }
  | { type: "INIT_ATTACHMENTS"; attachments: ProcurementAttachment[] }
  | { type: "DELETE_ATTACHMENT"; id: string }
  | { type: "ADD_DEADLINE"; deadline: DeadlineItem }
  | { type: "UPDATE_DEADLINE"; id: string; changes: Partial<DeadlineItem> }
  | { type: "UPDATE_DEADLINE_STATUS"; id: string; status: "On Track" | "At Risk" | "Overdue" | "Selesai" }
  | { type: "UPDATE_ACTION_STATUS"; id: string; status: ActionItem["status"] }
  | { type: "ADD_ACTION"; action: ActionItem }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "MARK_ALL_READ" }
  | { type: "ADD_NOTIFICATION"; notification: NotificationItem }
  | { type: "UPDATE_SETTINGS"; settings: Partial<ProcurementState["settings"]> };
