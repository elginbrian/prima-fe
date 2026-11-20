import { FileCheck2, CheckCircle2, FileText, RotateCcw } from "lucide-react";
import { DocumentStatsProps } from "./types";
import type { DocumentStatus } from "@/types";

export function DocumentStats({
  totalCount,
  readyCount,
  attnCount,
  notReadyCount,
  readyPct,
  attnPct,
  activeFilter = "All",
  onSelectFilter,
}: DocumentStatsProps) {
  const notReadyPct = Math.max(0, 100 - readyPct - attnPct);

  const cards: {
    id: DocumentStatus | "All";
    label: string;
    value: number;
    pct?: number;
    subtext: string;
    icon: typeof FileCheck2;
  }[] = [
    {
      id: "All",
      label: "Total Dokumen",
      value: totalCount,
      subtext: "Tercatat dalam sistem",
      icon: FileText,
    },
    {
      id: "Lulus Verifikasi",
      label: "Lulus Verifikasi",
      value: readyCount,
      pct: readyPct,
      subtext: "Sesuai standar checklist",
      icon: CheckCircle2,
    },
    {
      id: "Catatan Procurement",
      label: "Catatan Review",
      value: attnCount,
      pct: attnPct,
      subtext: "Perlu peninjauan catatan",
      icon: FileCheck2,
    },
    {
      id: "Tindak Lanjut FPP",
      label: "Tindak Lanjut FPP",
      value: notReadyCount,
      pct: notReadyPct,
      subtext: "Perlu dilengkapi pemohon",
      icon: RotateCcw,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter?.(card.id)}
            title={`Filter: ${card.label} — ${card.subtext}`}
            className={`group flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all focus:outline-none ${
              isActive
                ? "border-[#0a4d8c] bg-[#f4f8fd] shadow-2xs"
                : "border-slate-200 bg-white hover:border-[#0a4d8c]/40 hover:bg-slate-50/40"
            }`}
          >
            <div className="min-w-0">
              <div
                className={`text-[10px] font-medium uppercase tracking-wider truncate ${
                  isActive ? "text-[#0a4d8c]" : "text-slate-500"
                }`}
              >
                {card.label}
              </div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-xl font-semibold text-slate-900">
                  {card.value}
                </span>
                {card.pct !== undefined && (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal text-slate-600 leading-none">
                    {card.pct.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-[#0a4d8c] text-white"
                  : "bg-slate-100 text-slate-500 group-hover:bg-[#e8f2fc] group-hover:text-[#0a4d8c]"
              }`}
            >
              <Icon size={15} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
