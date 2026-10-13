import type { ProcurementOperationalStatus, ProcurementStage, ProcurementStep, BaseUser, Department } from "@/types";
import { ReactNode } from "react";

export type TrackerStage = ProcurementOperationalStatus;

export interface TrackerItem {
  id: string;
  title: string;
  pic: BaseUser;
  amount: number;
  stage: ProcurementStage;
  operationalStatus: ProcurementOperationalStatus;
  currentStep: ProcurementStep;
  department: Department;
  stageStartedAt: string;
  isUrgent?: boolean;
}

export interface TrackerHeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (val: string) => void;
  operationalStatusFilter: ProcurementOperationalStatus | "All";
  setOperationalStatusFilter: (val: ProcurementOperationalStatus | "All") => void;
  viewMode: "kanban" | "list" | "analytics";
  setViewMode: (val: "kanban" | "list" | "analytics") => void;
  onExport?: () => void;
}

export interface TrackerListProps {
  filteredItems: TrackerItem[];
  timeStatusMap: Record<string, string>;
  documentsMap: Record<string, { total: number; valid: number }>;
  openRequestDetail: (id: string) => void;
}

export interface TrackerKanbanBoardProps {
  totalItemsCount: number;
  onGoingCount: number;
  onHoldCount: number;
  cancelledCount: number;
  itemsByStage: Record<TrackerStage, TrackerItem[]>;
  timeStatusMap: Record<string, string>;
  expandedCardId: string | null;
  setExpandedCardId: (id: string | null) => void;
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, status: TrackerStage) => void;
  openRequestDetail: (id: string) => void;
  onAddRequest: () => void;
}

export interface TrackerDeadlinesProps {
  deadlines: (import("@/types").DeadlineItem & { daysRemaining: number })[];
  requests: import("@/types").ProcurementRequest[];
  openRequestDetail: (id: string) => void;
  setEditingDeadlineId: (id: string) => void;
}

export interface TrackerDetailModalProps {
  selectedRequestId: string;
  setSelectedRequestId: (id: string | null) => void;
  request?: import("@/types").ProcurementRequest;
  milestones: import("@/types").ProcurementMilestone[];
  docs: import("@/types").DocumentItem[];
  guars: import("@/types").GuaranteeItem[];
  slas: (import("@/types").DeadlineItem & { daysRemaining: number })[];
  history: import("@/types").HistoryItem[];
  showFullTimeline: boolean;
  setShowFullTimeline: (val: boolean) => void;
  statusReasonDraft: string;
  setStatusReasonDraft: (val: string) => void;
  moveRequestStep: (id: string, step: ProcurementStep, force?: boolean, overrideReason?: string) => Promise<unknown> | void;
  updateRequestOperationalStatus: (id: string, status: ProcurementOperationalStatus, reason?: string) => void;
  expandedRelatedId: string | null;
  setExpandedRelatedId: (val: React.SetStateAction<string | null>) => void;
  router: any;
  setAddingDeadlineRequestId: (id: string | null) => void;
  setEditingDeadlineId: (id: string | null) => void;
}
