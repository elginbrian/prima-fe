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
  hold_started_at?: string;
  total_hold_days?: number;
  current_step: string;
  department: DepartmentDto;
  stage_started_at: string;
  is_urgent: boolean;
  procurement_method?: string;
  created_at: string;
  updated_at: string;
  milestones?: MilestoneDto[];
}

export interface ProcurementActivityDto {
  id: string;
  request_id: string;
  action: string;
  user_id?: string;
  user_name?: string;
  previous_state?: string;
  new_state?: string;
  notes?: string;
  created_at: string;
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
  procurement_method?: string;
  is_urgent?: boolean;
}

export interface AssignPicPayload {
  new_pic_id: string;
  new_pic_name: string;
  handover_notes?: string;
}

export interface MoveStagePaylod {
  stage: string;
}

export interface MoveStepPayload {
  step: string;
  force?: boolean;
  override_reason?: string;
}

export interface GatekeeperBlockerDto {
  category: string;
  title: string;
  description: string;
  severity: string;
}

export interface GatekeeperCheckDto {
  request_id: string;
  current_stage: string;
  current_step: string;
  is_ready_to_advance: boolean;
  blockers: GatekeeperBlockerDto[];
  warnings: GatekeeperBlockerDto[];
  mandatory_documents_total: number;
  mandatory_documents_verified: number;
  can_override: boolean;
}

export interface UpdateOperationalStatusPayload {
  status: string;
  reason?: string;
}

// ─── Analytics & Intelligence DTOs (Fitur 4.3) ─────────────────────────────

export interface AnalyticsSummaryDto {
  total_procurements: number;
  total_budget: number;
  overall_compliance_rate: number;
  total_deadlines: number;
  overdue_deadlines: number;
  escalated_deadlines: number;
}

export interface DepartmentComplianceDto {
  department: string;
  total_deadlines: number;
  compliant: number;
  overdue: number;
  compliance_rate: number;
}

export interface BottleneckDto {
  milestone: string;
  overdue_count: number;
  severity: "High" | "Medium" | "Low";
}

export interface VendorRiskDto {
  vendor_name: string;
  total_guarantees: number;
  total_value: number;
  expiring_soon: number;
  claimed: number;
  risk_level: "High" | "Medium" | "Low";
}

export interface DocumentStatsDto {
  total: number;
  verified: number;
  with_notes: number;
  follow_up: number;
}

export interface AnalyticsOverviewDto {
  summary: AnalyticsSummaryDto;
  deadline_stats: Record<string, number>;
  department_compliance: DepartmentComplianceDto[];
  bottlenecks: BottleneckDto[];
  vendor_risk_index: VendorRiskDto[];
  methods_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  stage_breakdown: Record<string, number>;
  document_stats: DocumentStatsDto;
}

// ─── Document (Modul D1) ──────────────────────────────────────────────────

export interface DocumentDto {
  id: string;
  request_id: string;
  name: string;
  type: string;
  status: string;
  upload_date: string;
  pic_id: string;
  pic_name: string;
  issues: string[];
  document_kind?: string;
  next_action?: string;
  procurement_step?: string;
  document_date?: string;
  document_number?: string;
  file_url?: string;
  mime_type?: string;
  version_number?: number;
  parent_document_id?: string;
  revision_notes?: string;
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
  vendor_id: string;
  vendor_name: string;
  issue_date: string;
  expiry_date: string;
  pic_id: string;
  pic_name: string;
  status: string;
  next_action?: string;
  file_url?: string;
  file_url_signed?: string;
  claim_letter_no?: string;
  claim_reason?: string;
  claim_amount?: number;
  bast_no?: string;
  release_date?: string;
  amendment_letter_no?: string;
  is_threshold_compliant?: boolean;
  min_required_value?: number;
  threshold_warning?: string;
}

export interface PresignedPost {
  url: string;
  fields: Record<string, string>;
}

export interface ExtractedGuaranteeDto {
  type?: string;
  vendor_name?: string;
  issuer?: string;
  issuer_type?: "Bank" | "Asuransi" | "Lainnya";
  beneficiary?: string;
  reference_no?: string;
  value?: number;
  issue_date?: string;
  expiry_date?: string;
}

export interface EvaluateSlaResponseDto {
  total_evaluated: number;
  on_track: number;
  at_risk: number;
  overdue: number;
  escalated: number;
  paused: number;
  sla_warning_days: number;
  auto_escalate_days: number;
  evaluated_at: string;
}

export interface DeadlineDto {
  id: string;
  request_id: string;
  task_name: string;
  milestone: string;
  pic_id: string;
  pic_name: string;
  department_id: string;
  department_name: string;
  target_date: string;
  status: string;
  urgency_level: string;
  start_date?: string;
  next_action?: string;
  overdue_reason?: string;
  related_id?: string;
  paused_at?: string;
  accumulated_paused_days?: number;
  is_escalated?: boolean;
  escalated_at?: string;
  escalated_to?: string;
  recovery_date?: string;
  recovery_plan?: string;
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
  getActivities: (id: string) =>
    apiFetch<ProcurementActivityDto[]>(`/procurement/${id}/activities`),
  getGatekeeper: (id: string) =>
    apiFetch<GatekeeperCheckDto>(`/procurement/${id}/gatekeeper`),
  assignPic: (id: string, payload: AssignPicPayload) =>
    apiFetch<ProcurementRequestDto>(`/procurement/${id}/assign-pic`, { method: "PATCH", body: JSON.stringify(payload) }),
  getAnalytics: () =>
    apiFetch<AnalyticsOverviewDto>("/procurement/analytics/overview"),
};

export const documentsApi = {
  getAll: (requestId?: string) =>
    apiFetch<DocumentDto[]>(requestId ? `/documents?request_id=${requestId}` : "/documents"),
  getById: (id: string) => apiFetch<DocumentDto>(`/documents/${id}`),
  add: (payload: Partial<DocumentDto>) =>
    apiFetch<DocumentDto>("/documents", { method: "POST", body: JSON.stringify(payload) }),
  updateStatus: (id: string, status: string) =>
    apiFetch<DocumentDto>(`/documents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getViewUrl: (id: string) =>
    apiFetch<{ view_url: string; file_name: string }>(`/documents/${id}/view-url`),
  createRevision: (id: string, payload: { pic_id: string; pic_name: string; revision_notes: string; name?: string; file_url?: string; mime_type?: string; document_date?: string; document_number?: string }) =>
    apiFetch<DocumentDto>(`/documents/${id}/revision`, { method: "POST", body: JSON.stringify(payload) }),
  getRevisions: (id: string) =>
    apiFetch<DocumentDto[]>(`/documents/${id}/revisions`),
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
    apiFetch<{ presigned_post: PresignedPost; object_key: string }>(`/guarantees/${id}/upload-url?content_type=${encodeURIComponent(contentType)}`),
  getViewUrl: (id: string) =>
    apiFetch<{ view_url: string; file_name: string }>(`/guarantees/${id}/view-url`),
  claim: (id: string, payload: { claim_letter_no: string; claim_reason: string; claim_amount?: number }) =>
    apiFetch<GuaranteeDto>(`/guarantees/${id}/claim`, { method: "POST", body: JSON.stringify(payload) }),
  release: (id: string, payload: { bast_no: string; release_notes?: string }) =>
    apiFetch<GuaranteeDto>(`/guarantees/${id}/release`, { method: "POST", body: JSON.stringify(payload) }),
  amend: (id: string, payload: { amendment_no: string; new_expiry_date: string; new_value?: number; amendment_reason?: string }) =>
    apiFetch<GuaranteeDto>(`/guarantees/${id}/amend`, { method: "POST", body: JSON.stringify(payload) }),
  remove: (id: string) => apiFetch<null>(`/guarantees/${id}`, { method: "DELETE" }),
  extract: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<ExtractedGuaranteeDto>("/guarantees/extract", { method: "POST", body: formData });
  },
};

export const deadlinesApi = {
  getAll: (requestId?: string) =>
    apiFetch<DeadlineDto[]>(requestId ? `/deadlines?request_id=${requestId}` : "/deadlines"),
  getById: (id: string) => apiFetch<DeadlineDto>(`/deadlines/${id}`),
  add: (payload: Partial<DeadlineDto>) =>
    apiFetch<DeadlineDto>("/deadlines", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<DeadlineDto>) =>
    apiFetch<DeadlineDto>(`/deadlines/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  evaluateSla: (requestId?: string) =>
    apiFetch<EvaluateSlaResponseDto>(requestId ? `/deadlines/evaluate-sla?request_id=${requestId}` : "/deadlines/evaluate-sla", { method: "POST" }),
  escalate: (id: string, payload: { escalated_to?: string; reason?: string }) =>
    apiFetch<DeadlineDto>(`/deadlines/${id}/escalate`, { method: "POST", body: JSON.stringify(payload) }),
  submitRecoveryPlan: (id: string, payload: { recovery_plan: string; recovery_date: string }) =>
    apiFetch<DeadlineDto>(`/deadlines/${id}/recovery-plan`, { method: "POST", body: JSON.stringify(payload) }),
};
