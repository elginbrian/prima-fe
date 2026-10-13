import { Search, Filter, LayoutGrid, LayoutList } from "lucide-react";
import type { ProcurementOperationalStatus } from "@/types";

import { TrackerHeaderProps } from "./types";

export function TrackerHeader({
  searchQuery, setSearchQuery,
  departmentFilter, setDepartmentFilter,
  operationalStatusFilter, setOperationalStatusFilter,
  viewMode, setViewMode,
  onExport
}: TrackerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3 shrink-0">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari ID pengadaan, judul, atau PIC..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
        />
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative flex items-center gap-2 w-full sm:w-auto">
          <Filter className="absolute left-3 text-slate-400 pointer-events-none" size={16} />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-[200px] pl-9 pr-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:border-[#0a4d8c] appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
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
            onChange={(e) => setOperationalStatusFilter(e.target.value as ProcurementOperationalStatus | "All")}
            className="w-full sm:w-[145px] px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:border-[#0a4d8c] appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <option value="All">Semua Status</option>
            <option value="On Going">On Going</option>
            <option value="On Hold">On Hold</option>
            <option value="Batal">Batal</option>
          </select>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button type="button" onClick={() => setViewMode("kanban")} title="Tampilan Kanban" className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-blue-50 text-[#0a4d8c]" : "text-slate-400 hover:bg-slate-50"}`}><LayoutGrid size={18} /></button>
          <button type="button" onClick={() => setViewMode("list")} title="Tampilan List" className={`border-l border-slate-200 p-2 transition-colors ${viewMode === "list" ? "bg-blue-50 text-[#0a4d8c]" : "text-slate-400 hover:bg-slate-50"}`}><LayoutList size={18} /></button>
        </div>
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
            title="Unduh Rekapitulasi Tracker Pengadaan ke Excel (CSV)"
          >
            <span>📥 Ekspor Excel</span>
          </button>
        )}
      </div>
    </div>
  );
}
