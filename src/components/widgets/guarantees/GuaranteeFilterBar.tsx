import { Search, Filter } from "lucide-react";
import { GuaranteeStatus } from "@/types";

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
    <div className="flex flex-col xl:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari referensi, tipe, atau PIC..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
        />
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="hidden sm:block text-slate-400 shrink-0" size={18} />
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-[130px] lg:w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white truncate"
            >
              <option value="All">Semua Tipe</option>
              <option value="Jaminan Pelaksanaan">Pelaksanaan</option>
              <option value="Jaminan Masa Pemeliharaan">Pemeliharaan</option>
              <option value="Jaminan Uang Muka">Uang Muka</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-[130px] lg:w-[150px] border border-slate-200 rounded-lg text-[13px] px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white truncate"
            >
              <option value="All">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Mendekati Expiry">Mendekati</option>
              <option value="Expired">Expired</option>
              <option value="Klaim Diajukan">Klaim Diajukan</option>
              <option value="Dikembalikan">Dikembalikan</option>
            </select>
          </div>
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
              title="Unduh Rekapitulasi Jaminan ke Excel (CSV)"
            >
              <Search className="hidden" size={0} />
              <span className="font-bold">📥 Ekspor Excel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
