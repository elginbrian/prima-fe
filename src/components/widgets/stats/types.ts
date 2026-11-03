import type { DocumentStatus } from "@/types";

export interface GuaranteeStatsProps {
  totalCount: number;
  aktifCount: number;
  mendekatiCount: number;
  expiredCount: number;
  aktifPct: number;
  mendekatiPct: number;
}

export interface DocumentStatsProps {
  totalCount: number;
  readyCount: number;
  attnCount: number;
  notReadyCount: number;
  readyPct: number;
  attnPct: number;
  activeFilter?: DocumentStatus | "All";
  onSelectFilter?: (filter: DocumentStatus | "All") => void;
}

export interface ActionStatsProps {
  totalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  highPct: number;
  mediumPct: number;
}
