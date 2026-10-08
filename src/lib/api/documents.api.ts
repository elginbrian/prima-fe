import { apiFetch } from "./client";
import { DocumentStatus, DocumentType } from "@/types";

export interface DocumentDto {
  id: string;
  request_id: string;
  name: string;
  type: string;
  document_kind?: string;
  status: string;
  upload_date: string;
  pic_id: string;
  pic_name: string;
  issues: string[];
  next_action?: string;
  procurement_step?: string;
  document_date?: string;
  document_number?: string;
  file_url?: string;
  mime_type?: string;
}

export const documentsApi = {
  getAll: (requestId?: string) =>
    apiFetch<DocumentDto[]>(`/api/v1/documents${requestId ? `?request_id=${requestId}` : ""}`),

  getById: (id: string) =>
    apiFetch<DocumentDto>(`/api/v1/documents/${id}`),

  add: (payload: Partial<DocumentDto>) =>
    apiFetch<DocumentDto>("/api/v1/documents", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<DocumentDto>) =>
    apiFetch<DocumentDto>(`/api/v1/documents/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};
