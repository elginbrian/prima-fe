import { apiFetch } from "./client";
import type {
  ValidationProfile,
  CreateValidationProfilePayload,
  UpdateValidationProfilePayload,
  DocumentValidationResponse,
  ExtractedCriteriaResponse,
  ReevaluateValidationPayload,
  PublishValidationToTrackerPayload,
  UpdateValidationDecisionPayload,
  ValidationLogListItem,
  WorkflowStage,
  CreateWorkflowStagePayload,
  UpdateWorkflowStagePayload,
  ReorderWorkflowStagesPayload,
} from "@/types/validation";

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

  // ─── MODUL D1: VALIDATION PROFILES & AI CHECKLIST ─────────────────────────
  getProfiles: (documentKind?: string, scope?: string) => {
    const params = new URLSearchParams();
    if (documentKind) params.append("document_kind", documentKind);
    if (scope) params.append("scope", scope);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<ValidationProfile[]>(`/documents/profiles${qs}`);
  },
  getProfileById: (id: string) =>
    apiFetch<ValidationProfile>(`/documents/profiles/${id}`),
  createProfile: (payload: CreateValidationProfilePayload) =>
    apiFetch<ValidationProfile>("/documents/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateProfile: (id: string, payload: UpdateValidationProfilePayload) =>
    apiFetch<ValidationProfile>(`/documents/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProfile: (id: string) =>
    apiFetch<{ message: string }>(`/documents/profiles/${id}`, {
      method: "DELETE",
    }),
  extractCriteria: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<ExtractedCriteriaResponse>("/documents/extract-criteria", {
      method: "POST",
      body: fd,
    });
  },
  analyzeChecklist: (formData: FormData) =>
    apiFetch<DocumentValidationResponse>("/documents/analyze-checklist", {
      method: "POST",
      body: formData,
    }),
  reevaluateValidation: (id: string, payload: ReevaluateValidationPayload) =>
    apiFetch<DocumentValidationResponse>(`/documents/validations/${id}/re-evaluate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  publishToTracker: (payload: PublishValidationToTrackerPayload) =>
    apiFetch<{ success: boolean; message: string; request_id: string; auto_cleared_stages_count: number }>(
      "/documents/publish-to-tracker",
      { method: "POST", body: JSON.stringify(payload) }
    ),
  getValidationById: (id: string) =>
    apiFetch<DocumentValidationResponse>(`/documents/validations/${id}`),
  updateValidationDecision: (id: string, payload: UpdateValidationDecisionPayload) =>
    apiFetch<DocumentValidationResponse>(`/documents/validations/${id}/decision`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getValidationLogs: (requestId?: string) =>
    apiFetch<ValidationLogListItem[]>(
      requestId ? `/documents/validations?request_id=${encodeURIComponent(requestId)}` : "/documents/validations"
    ),

  // ─── ADMIN WORKFLOW STAGES ───────────────────────────────────────────────
  getWorkflowStages: (procurementMethod?: string) => {
    const qs = procurementMethod
      ? `?procurement_method=${encodeURIComponent(procurementMethod)}`
      : "";
    return apiFetch<WorkflowStage[]>(`/workflow/stages${qs}`);
  },
  createWorkflowStage: (payload: CreateWorkflowStagePayload) =>
    apiFetch<WorkflowStage>("/workflow/stages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateWorkflowStage: (id: string, payload: UpdateWorkflowStagePayload) =>
    apiFetch<WorkflowStage>(`/workflow/stages/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  reorderWorkflowStages: (payload: ReorderWorkflowStagesPayload) =>
    apiFetch<WorkflowStage[]>("/workflow/stages/reorder", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteWorkflowStage: (id: string) =>
    apiFetch<{ message: string }>(`/workflow/stages/${id}`, {
      method: "DELETE",
    }),
};
