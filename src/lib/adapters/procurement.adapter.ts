/**
 * D3 Procurement Adapter
 *
 * Converts BE response (snake_case, ProcurementRequestDto) →
 * FE domain types (camelCase, ProcurementRequest from @/types)
 *
 * This is the bridge layer — TrackerPage continues to use @/types,
 * but data can now come from either mock state or BE API.
 */
import type { ProcurementRequest, ProcurementMilestone, ProcurementStep, ProcurementStage, DeadlineItem, DocumentItem, DocumentKind } from "@/types";
import type { ProcurementRequestDto, MilestoneDto, DeadlineDto, DocumentDto } from "@/lib/api/procurement.api";

export function dtoToRequest(dto: ProcurementRequestDto): ProcurementRequest {
  return {
    id: dto.id,
    title: dto.title,
    pic: { id: dto.pic.id, name: dto.pic.name },
    fpp: { id: dto.fpp.id, name: dto.fpp.name },
    amount: dto.amount,
    stage: dto.stage as ProcurementStage,
    operationalStatus: dto.operational_status as ProcurementRequest["operationalStatus"],
    operationalStatusReason: dto.operational_status_reason,
    currentStep: dto.current_step as ProcurementStep,
    department: { id: dto.department.id, name: dto.department.name },
    stageStartedAt: dto.stage_started_at,
    isUrgent: dto.is_urgent,
    procurementMethod: dto.procurement_method || "Tender Terbuka",
    holdStartedAt: dto.hold_started_at,
    totalHoldDays: dto.total_hold_days,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export function dtoToMilestone(dto: MilestoneDto): ProcurementMilestone {
  return {
    id: dto.id,
    requestId: dto.request_id,
    step: dto.step as ProcurementStep,
    status: dto.status as ProcurementMilestone["status"],
    documentId: dto.document_id,
    date: dto.date,
    pic: dto.pic ? { id: dto.pic.id, name: dto.pic.name } : undefined,
    notes: dto.notes,
  };
}

export function dtoListToRequests(dtos: ProcurementRequestDto[]): ProcurementRequest[] {
  return dtos.map(dtoToRequest);
}

export function dtoToDeadline(dto: DeadlineDto): DeadlineItem {
  return {
    id: dto.id,
    requestId: dto.request_id,
    relatedId: dto.related_id,
    taskName: dto.task_name,
    targetDate: dto.target_date ? String(dto.target_date).trim().split(/[\sT]/)[0] : "",
    startDate: dto.start_date ? String(dto.start_date).trim().split(/[\sT]/)[0] : "",
    status: dto.status as DeadlineItem["status"],
    urgencyLevel: dto.urgency_level as DeadlineItem["urgencyLevel"],
    milestone: dto.milestone,
    nextAction: dto.next_action,
    overdueReason: dto.overdue_reason,
    pausedAt: dto.paused_at,
    accumulatedPausedDays: dto.accumulated_paused_days,
    isEscalated: dto.is_escalated,
    escalatedAt: dto.escalated_at,
    escalatedTo: dto.escalated_to,
    recoveryDate: dto.recovery_date ? String(dto.recovery_date).trim().split(/[\sT]/)[0] : undefined,
    recoveryPlan: dto.recovery_plan,
    pic: { id: dto.pic_id, name: dto.pic_name },
    department: { id: dto.department_id, name: dto.department_name },
  };
}

export function dtoToDocument(dto: DocumentDto): DocumentItem {
  return {
    id: dto.id,
    requestId: dto.request_id,
    name: dto.name,
    type: dto.type as DocumentItem["type"],
    status: dto.status as DocumentItem["status"],
    uploadDate: dto.upload_date,
    pic: { id: dto.pic_id, name: dto.pic_name },
    issues: dto.issues,
    documentKind: dto.document_kind as DocumentKind | undefined,
    nextAction: dto.next_action,
    procurementStep: dto.procurement_step as ProcurementStep,
    documentDate: dto.document_date,
    documentNumber: dto.document_number,
    fileUrl: dto.file_url,
    mimeType: dto.mime_type,
    versionNumber: dto.version_number ?? 1,
    parentDocumentId: dto.parent_document_id,
    revisionNotes: dto.revision_notes,
  };
}
