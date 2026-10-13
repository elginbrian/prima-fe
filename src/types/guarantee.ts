import { BaseUser } from "./core";

export type GuaranteeStatus =
  | "Aktif"
  | "Mendekati Expiry"
  | "Expired"
  | "Klaim Diajukan"
  | "Dikembalikan";

export type GuaranteeType =
  | "Jaminan Pelaksanaan"
  | "Jaminan Masa Pemeliharaan"
  | "Jaminan Uang Muka";

export type GuaranteeIssuerType = "Bank" | "Asuransi" | "Lainnya";

export interface GuaranteeItem {
  id: string;
  requestId: string;
  referenceNo: string;
  type: GuaranteeType;
  value: number;
  issuer: string;
  issuerType?: GuaranteeIssuerType;
  beneficiary?: string;
  vendor: BaseUser;
  issueDate: string;
  submissionDate?: string;
  expiryDate: string;
  pic: BaseUser;
  status: GuaranteeStatus;
  nextAction?: string;
  fileUrl?: string;
  mimeType?: string;
  claimLetterNo?: string;
  claimReason?: string;
  claimAmount?: number;
  bastNo?: string;
  releaseDate?: string;
  amendmentLetterNo?: string;
  isThresholdCompliant?: boolean;
  minRequiredValue?: number;
  thresholdWarning?: string;
}
