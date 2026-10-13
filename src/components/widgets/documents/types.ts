import type { DocumentItem, ProcurementRequest, DocumentStatus, ProcurementOperationalStatus } from "@/types";

export interface DocumentGroupRowProps {
  request: ProcurementRequest;
  documents: DocumentItem[];
}

export interface DocumentFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: DocumentStatus | "All";
  setStatusFilter: (val: DocumentStatus | "All") => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  workStatusFilter: ProcurementOperationalStatus | "All";
  setWorkStatusFilter: (val: ProcurementOperationalStatus | "All") => void;
  onExport?: () => void;
}
