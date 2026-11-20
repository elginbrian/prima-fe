import { Search, Filter, RefreshCw, Download } from "lucide-react";
import { SearchableSelect } from "@/components/ui";
import { ActionFilterBarProps } from "./types";

const SOURCE_OPTIONS = [
  { value: "All", label: "Semua Sumber" },
  { value: "Dokumen", label: "Dokumen" },
  { value: "Jaminan", label: "Jaminan" },
  { value: "Deadline", label: "Batas Waktu (SLA)" },
  { value: "Proses Pengadaan", label: "Pekerjaan" },
];

const PRIORITY_OPTIONS = [
  { value: "All", label: "Semua Prioritas" },
  { value: "High", label: "Tinggi (High)" },
  { value: "Medium", label: "Sedang (Medium)" },
  { value: "Low", label: "Rendah (Low)" },
];

export function ActionFilterBar({
  searchQuery,
  setSearchQuery,
  sourceFilter,
  setSourceFilter,
  priorityFilter,
  setPriorityFilter,
  onExport,
  onSyncSla,
  isSyncingSla,
}: ActionFilterBarProps) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="text"
          placeholder="Cari kode referensi, deskripsi tindak lanjut, atau PIC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
        <Filter className="hidden sm:block text-slate-400 shrink-0" size={16} />
        <SearchableSelect
          size="sm"
          className="w-full sm:w-44"
          value={sourceFilter}
          onChange={(val) => setSourceFilter(val as any)}
          searchPlaceholder="Cari sumber..."
          options={SOURCE_OPTIONS}
        />
        <SearchableSelect
          size="sm"
          className="w-full sm:w-44"
          value={priorityFilter}
          onChange={(val) => setPriorityFilter(val as any)}
          searchPlaceholder="Cari prioritas..."
          options={PRIORITY_OPTIONS}
        />
        {onSyncSla && (
          <button
            type="button"
            onClick={onSyncSla}
            disabled={isSyncingSla}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors disabled:opacity-50"
            title="Jalankan evaluasi SLA harian dan auto-eskalasi manajerial"
          >
            <RefreshCw size={14} className={isSyncingSla ? "animate-spin text-[#0a4d8c]" : "text-[#0a4d8c]"} />
            <span>{isSyncingSla ? "Sinkronisasi..." : "Sinkronisasi SLA"}</span>
          </button>
        )}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
            title="Unduh Rekapitulasi Tindakan & SLA ke Excel (CSV)"
          >
            <Download size={14} className="text-[#0a4d8c]" />
            <span>Ekspor</span>
          </button>
        )}
      </div>
    </div>
  );
}
