import { apiFetch } from "./client";

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
};
