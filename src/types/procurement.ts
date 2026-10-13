import { BaseUser, Department } from "./core";

export type ProcurementStage =
  | "Persiapan"
  | "Sourcing"
  | "Evaluasi"
  | "Contracting"
  | "Selesai";

export type ProcurementOperationalStatus = "On Going" | "On Hold" | "Batal";

export type ProcurementStep =
  | "Rapat Pra-Tender"
  | "Pengumuman Pengadaan"
  | "Prebid Meeting"
  | "Pemasukan Dokumen Penawaran"
  | "Pembukaan Penawaran"
  | "Evaluasi Dokumen Penawaran"
  | "Sosialisasi e-Auction"
  | "Negosiasi e-Auction"
  | "Negosiasi Manual"
  | "Laporan Hasil Pemilihan"
  | "Pengumuman Pemenang"
  | "Penunjukan Pemenang"
  | "Undangan Pemilihan"
  | "Pembukaan & Evaluasi Penawaran"
  | "Klarifikasi & Negosiasi Teknis"
  | "Penetapan Pemenang"
  | "Undangan Penunjukan Langsung"
  | "Pemasukan & Evaluasi Dokumen"
  | "Klarifikasi & Negosiasi Harga";

export type ProcurementMilestoneStatus = "Pending" | "In Progress" | "Done" | "Skipped";

export interface ProcurementMilestone {
  id: string;
  requestId: string;
  step: ProcurementStep;
  status: ProcurementMilestoneStatus;
  documentId?: string;
  date?: string;
  pic?: BaseUser;
  notes?: string;
}

export interface ProcurementRequest {
  id: string;
  title: string;
  pic: BaseUser;
  fpp: BaseUser;
  amount: number;
  stage: ProcurementStage;
  operationalStatus: ProcurementOperationalStatus;
  operationalStatusReason?: string;
  currentStep: ProcurementStep;
  department: Department;
  stageStartedAt: string;
  isUrgent?: boolean;
  procurementMethod?: string;
  holdStartedAt?: string;
  totalHoldDays?: number;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus =
  | "Lulus Verifikasi"
  | "Catatan Procurement"
  | "Tindak Lanjut FPP";

export type DocumentType =
  | "Wajib"
  | "Kondisional"
  | "Best Practice"
  | "Dokumentasi";

export type DocumentKind = "Surat Penawaran" | "Surat Pernyataan" | "RKS" | "Pakta Integritas" | "TKDN" | "Lainnya";

export interface DocumentExtractedData {
  workName?: string;
  tenderNumber?: string;
  documentDate?: string;
}

export interface DocumentItem {
  id: string;
  requestId: string;
  name: string;
  type: DocumentType;
  documentKind?: DocumentKind;
  status: DocumentStatus;
  uploadDate: string;
  pic: BaseUser;
  issues: string[];
  nextAction?: string;
  procurementStep?: ProcurementStep;
  documentDate?: string;
  documentNumber?: string;
  canGenerateAiDraft?: boolean;
  fileUrl?: string;
  mimeType?: string;
  extractedData?: DocumentExtractedData;
  versionNumber?: number;
  parentDocumentId?: string;
  revisionNotes?: string;
}

export type ProcurementAttachmentType = "Dokumen Pendukung Lain";

export interface ProcurementAttachment {
  id: string;
  requestId: string;
  type: ProcurementAttachmentType;
  name: string;
  uploadedAt: string;
  uploadedBy: BaseUser;
  fileUrl: string;
  mimeType?: string;
  notes?: string;
}
