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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter?.(card.id)}
            className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus:outline-none ${
              isActive
                ? "border-[#0a4d8c] bg-[#f4f8fd] shadow-xs"
                : "border-slate-200 bg-white hover:border-[#0a4d8c]/40 hover:bg-slate-50/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div
                  className={`text-[11px] font-medium uppercase tracking-wider ${
                    isActive ? "text-[#0a4d8c]" : "text-slate-500"
                  }`}
                >
                  {card.label}
                </div>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-slate-900">
                    {card.value}
                  </span>
                  {card.pct !== undefined && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-normal text-slate-600">
                      {card.pct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#0a4d8c] text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-[#e8f2fc] group-hover:text-[#0a4d8c]"
                }`}
              >
                <Icon size={17} />
              </div>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] font-normal text-slate-500">
              {card.subtext}
            </div>
          </button>
        );
      })}
    </div>
  );
}
