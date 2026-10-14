/**
 * Procurement API — typed endpoint functions for /procurement
 * Re-exports documents, guarantees, and deadlines modules for backward compatibility.
 */
import { apiFetch } from "./client";

export * from "./documents.api";
export * from "./guarantees.api";
export * from "./deadlines.api";

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

// ─── Procurement Endpoint Functions ────────────────────────────────────────

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
