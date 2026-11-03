import { Search, Filter, RefreshCw, Download } from "lucide-react";
import { ActionFilterBarProps } from "./types";

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
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as any)}
          className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
        >
          <option value="All">Semua Sumber</option>
          <option value="Dokumen">Dokumen</option>
          <option value="Jaminan">Jaminan</option>
          <option value="Deadline">Batas Waktu (SLA)</option>
          <option value="Proses Pengadaan">Pekerjaan</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
        >
          <option value="All">Semua Prioritas</option>
          <option value="High">Tinggi (High)</option>
          <option value="Medium">Sedang (Medium)</option>
          <option value="Low">Rendah (Low)</option>
        </select>
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
