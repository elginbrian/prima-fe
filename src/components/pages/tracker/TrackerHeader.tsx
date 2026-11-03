import { Search, Filter, LayoutGrid, LayoutList, Download } from "lucide-react";
import type { ProcurementOperationalStatus } from "@/types";
import { TrackerHeaderProps } from "./types";

export function TrackerHeader({
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  operationalStatusFilter,
  setOperationalStatusFilter,
  viewMode,
  setViewMode,
  onExport,
}: TrackerHeaderProps) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="text"
          placeholder="Cari kode pekerjaan, judul pengadaan, atau PIC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
        <Filter className="hidden sm:block text-slate-400 shrink-0" size={16} />
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
        >
          <option value="All">Semua Departemen</option>
          <option value="IT Infrastructure">IT Infrastructure</option>
          <option value="HR">Human Resources</option>
          <option value="Operations">Operations</option>
          <option value="Creative">Creative</option>
          <option value="General Affairs">General Affairs</option>
        </select>

        <select
          value={operationalStatusFilter}
          onChange={(e) =>
            setOperationalStatusFilter(e.target.value as ProcurementOperationalStatus | "All")
          }
          className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
        >
          <option value="All">Semua Status</option>
          <option value="On Going">Berjalan (On Going)</option>
          <option value="On Hold">Ditunda (On Hold)</option>
          <option value="Batal">Dibatalkan</option>
        </select>

        <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            title="Tampilan Tabel"
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
              viewMode === "list"
                ? "bg-white text-[#0a4d8c] shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutList size={14} />
            <span className="hidden sm:inline">Tabel</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            title="Tampilan Papan Kanban"
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
              viewMode === "kanban"
                ? "bg-white text-[#0a4d8c] shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid size={14} />
            <span className="hidden sm:inline">Papan</span>
          </button>
        </div>

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
            title="Unduh Rekapitulasi Pekerjaan ke Excel (CSV)"
          >
            <Download size={14} className="text-[#0a4d8c]" />
            <span>Ekspor</span>
          </button>
        )}
      </div>
    </div>
  );
}
