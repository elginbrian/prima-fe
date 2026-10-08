import { apiFetch } from "./client";
import { DeadlineStatus, UrgencyLevel } from "@/types";

export interface DeadlineDto {
  id: string;
  request_id: string;
  related_id?: string;
  task_name: string;
  pic_id: string;
  pic_name: string;
  department_id: string;
  department_name: string;
  target_date: string;
  start_date?: string;
  status: DeadlineStatus;
  urgency_level: UrgencyLevel;
  milestone: string;
  next_action?: string;
  overdue_reason?: string;
  paused_at?: string;
  accumulated_paused_days?: number;
}

export const deadlinesApi = {
  getAll: (requestId?: string) =>
    apiFetch<DeadlineDto[]>(`/api/v1/deadlines/${requestId ? `?request_id=${requestId}` : ""}`),

  getById: (id: string) =>
    apiFetch<DeadlineDto>(`/api/v1/deadlines/${id}`),

  add: (payload: Partial<DeadlineDto>) =>
    apiFetch<DeadlineDto>("/api/v1/deadlines/", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<DeadlineDto>) =>
    apiFetch<DeadlineDto>(`/api/v1/deadlines/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};
