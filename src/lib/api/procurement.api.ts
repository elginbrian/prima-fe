/**
 * Procurement API — typed endpoint functions for /procurement, /documents, /guarantees, /deadlines
 */
import { apiFetch } from "./client";

// ─── Shared types ─────────────────────────────────────────────────────────

export interface BaseUserDto {
  id: string;
  name: string;
}

export interface DepartmentDto {
  id: string;
  name: string;
}

// ─── Procurement (Modul D3) ───────────────────────────────────────────────

export interface ProcurementRequestDto {
  id: string;
  title: string;
  pic: BaseUserDto;
  fpp: BaseUserDto;
  amount: number;
  stage: string;
  operational_status: string;
  operational_status_reason?: string;
  current_step: string;
  department: DepartmentDto;
  stage_started_at: string;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
  milestones?: MilestoneDto[];
}

export interface MilestoneDto {
  id: string;
  request_id: string;
  step: string;
  status: string;
  document_id?: string;
  date?: string;
  pic?: BaseUserDto;
  notes?: string;
}

export interface CreateProcurementPayload {
  title: string;
  pic_id: string;
  pic_name: string;
  fpp_id: string;
  fpp_name: string;
  amount: number;
  department_id: string;
  department_name: string;
  stage?: string;
  current_step?: string;
  is_urgent?: boolean;
}


export interface MoveStagePaylod {
  stage: string;
}

export interface MoveStepPayload {
  step: string;
}

export interface UpdateOperationalStatusPayload {
  status: string;
  reason?: string;
}

// ─── Document (Modul D1) ──────────────────────────────────────────────────

export interface DocumentDto {
  id: string;
  request_id: string;
  name: string;
  type: string;
  status: string;
  upload_date: string;
  pic: BaseUserDto;
  issues: string[];
  document_kind?: string;
  next_action?: string;
  procurement_step?: string;
  file_url?: string;
}

// ─── Guarantee (Modul D2) ─────────────────────────────────────────────────

export interface GuaranteeDto {
  id: string;
  request_id: string;
  reference_no: string;
  type: string;
  value: number;
  issuer: string;
  issuer_type?: string;
  beneficiary?: string;
  vendor: BaseUserDto;
  issue_date: string;
  expiry_date: string;
  pic: BaseUserDto;
  status: string;
  next_action?: string;
  file_url?: string;
  file_url_signed?: string;
}

// ─── Deadline / SLA (Modul D4) ────────────────────────────────────────────

export interface DeadlineDto {
  id: string;
  request_id: string;
  task_name: string;
  milestone: string;
  pic: BaseUserDto;
  department: DepartmentDto;
  target_date: string;
  status: string;
  urgency_level: string;
  start_date?: string;
  next_action?: string;
  overdue_reason?: string;
}

// ─── Endpoint functions ────────────────────────────────────────────────────

export const procurementApi = {
  getAll: () => apiFetch<ProcurementRequestDto[]>("/procurement"),
  getById: (id: string) => apiFetch<ProcurementRequestDto>(`/procurement/${id}`),
  create: (payload: CreateProcurementPayload) =>
    apiFetch<ProcurementRequestDto>("/procurement", { method: "POST", body: JSON.stringify(payload) }),
  moveStage: (id: string, payload: MoveStagePaylod) =>
    apiFetch<ProcurementRequestDto>(`/procurement/${id}/stage`, { method: "PATCH", body: JSON.stringify(payload) }),
  moveStep: (id: string, payload: MoveStepPayload) =>
    apiFetch<ProcurementRequestDto>(`/procurement/${id}/step`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateOperationalStatus: (id: string, payload: UpdateOperationalStatusPayload) =>
    apiFetch<ProcurementRequestDto>(`/procurement/${id}/operational-status`, { method: "PATCH", body: JSON.stringify(payload) }),
};

export const documentsApi = {
  getAll: (requestId?: string) =>
    apiFetch<DocumentDto[]>(requestId ? `/documents?request_id=${requestId}` : "/documents"),
  getById: (id: string) => apiFetch<DocumentDto>(`/documents/${id}`),
  add: (payload: Partial<DocumentDto>) =>
    apiFetch<DocumentDto>("/documents", { method: "POST", body: JSON.stringify(payload) }),
  updateStatus: (id: string, status: string) =>
    apiFetch<DocumentDto>(`/documents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const guaranteesApi = {
  getAll: (requestId?: string) =>
    apiFetch<GuaranteeDto[]>(requestId ? `/guarantees?request_id=${requestId}` : "/guarantees"),
  getById: (id: string) => apiFetch<GuaranteeDto>(`/guarantees/${id}`),
  add: (payload: Partial<GuaranteeDto>) =>
    apiFetch<GuaranteeDto>("/guarantees", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<GuaranteeDto>) =>
    apiFetch<GuaranteeDto>(`/guarantees/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getUploadUrl: (id: string, contentType: string) =>
    apiFetch<{ presigned_post: any; object_key: string }>(`/guarantees/${id}/upload-url?content_type=${encodeURIComponent(contentType)}`),
};

export const deadlinesApi = {
  getAll: (requestId?: string) =>
    apiFetch<DeadlineDto[]>(requestId ? `/deadlines?request_id=${requestId}` : "/deadlines"),
  getById: (id: string) => apiFetch<DeadlineDto>(`/deadlines/${id}`),
  add: (payload: Partial<DeadlineDto>) =>
    apiFetch<DeadlineDto>("/deadlines", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<DeadlineDto>) =>
    apiFetch<DeadlineDto>(`/deadlines/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
};
