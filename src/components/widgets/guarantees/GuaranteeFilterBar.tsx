import { Search, Filter, Download } from "lucide-react";
import { GuaranteeFilterBarProps } from "./types";

export function GuaranteeFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onExport,
}: GuaranteeFilterBarProps) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="text"
          placeholder="Cari referensi warkat, vendor, bank penerbit, atau judul pekerjaan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
        <Filter className="hidden sm:block text-slate-400 shrink-0" size={16} />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
        >
          <option value="All">Semua Tipe</option>
          <option value="Jaminan Pelaksanaan">Pelaksanaan</option>
          <option value="Jaminan Masa Pemeliharaan">Pemeliharaan</option>
          <option value="Jaminan Uang Muka">Uang Muka</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
        >
          <option value="All">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Mendekati Expiry">Mendekati Jatuh Tempo</option>
          <option value="Expired">Kedaluwarsa</option>
          <option value="Klaim Diajukan">Klaim Diajukan</option>
          <option value="Dikembalikan">Dikembalikan</option>
        </select>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
            title="Unduh Rekapitulasi Jaminan ke Excel (CSV)"
          >
            <Download size={14} className="text-[#0a4d8c]" />
            <span>Ekspor</span>
          </button>
        )}
      </div>
    </div>
  );
}
