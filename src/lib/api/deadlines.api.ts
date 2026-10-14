import { apiFetch } from "./client";

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
