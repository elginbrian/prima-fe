import { GuaranteeItem, GuaranteeStatus, ProcurementRequest } from "@/types";

export interface GuaranteeGroupRowProps {
  request: ProcurementRequest;
  guarantees: GuaranteeItem[];
  onEdit: (guarantee: GuaranteeItem) => void;
}

export interface GuaranteeFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: GuaranteeStatus | "All";
  setStatusFilter: (val: GuaranteeStatus | "All") => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  onExport?: () => void;
}
