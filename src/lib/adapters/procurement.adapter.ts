/**
 * D3 Procurement Adapter
 *
 * Converts BE response (snake_case, ProcurementRequestDto) →
 * FE domain types (camelCase, ProcurementRequest from @/types)
 *
 * This is the bridge layer — TrackerPage continues to use @/types,
 * but data can now come from either mock state or BE API.
 */
import type { ProcurementRequest, ProcurementMilestone, ProcurementStep, ProcurementStage } from "@/types";
import type { ProcurementRequestDto, MilestoneDto } from "@/lib/api/procurement.api";

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

// Minimal stub adapters to fix build errors in TrackerPage
export function dtoToDeadline(dto: any): any {
  return {
    ...dto,
    requestId: dto.request_id ?? dto.requestId,
    taskName: dto.task_name ?? dto.taskName,
    targetDate: dto.target_date ?? dto.targetDate,
    urgencyLevel: dto.urgency_level ?? dto.urgencyLevel ?? "Normal",
    pic: dto.pic ? { id: dto.pic.id, name: dto.pic.name } : undefined,
    department: dto.department ? { id: dto.department.id, name: dto.department.name } : undefined,
  };
}

export function dtoToDocument(dto: any): any {
  return {
    ...dto,
    requestId: dto.request_id ?? dto.requestId,
    uploadDate: dto.upload_date ?? dto.uploadDate ?? new Date().toISOString().split('T')[0],
    pic: dto.pic ? { id: dto.pic.id, name: dto.pic.name } : undefined,
  };
}
