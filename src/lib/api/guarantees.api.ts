import { apiFetch } from "./client";

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
